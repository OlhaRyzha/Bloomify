import logging
import re
from dataclasses import dataclass

from django.conf import settings
from django.db import transaction
from django.utils.html import escape

from notifications.models import TelegramOrderSubscription
from notifications.telegram import TelegramNotificationError, send_telegram_message
from shop.models.order import Order
from shop.types import JsonMapping, is_json_object

logger = logging.getLogger(__name__)

ORDER_START_PATTERN = re.compile(
    r"^/start\s+order_(?P<order_id>\d+)$|^order_(?P<plain_order_id>\d+)$"
)

CUSTOMER_ORDER_STATUS_LABELS = {
    "pending": "Очікує оплати",
    "paid": "Оплачено",
    "processing": "Готується",
    "ready_for_delivery": "Готове до доставки",
    "out_for_delivery": "Кур'єр вже в дорозі до вас",
    "delivered": "Доставлено",
    "failed": "Не вдалося оплатити",
    "fulfilled": "Виконано",
    "canceled": "Скасовано",
}

CUSTOMER_PAYMENT_STATUS_LABELS = {
    "not_required": "Оплата при отриманні",
    "pending": "Очікує оплати",
    "paid": "Оплачено",
    "failed": "Оплата не пройшла",
    "canceled": "Скасовано",
}


@dataclass(frozen=True)
class TelegramCustomerChat:
    chat_id: str
    user_id: int | None
    username: str
    first_name: str


class CustomerTelegramBotError(Exception):
    pass


def handle_customer_bot_update(payload: JsonMapping) -> None:
    message = get_mapping(payload, "message")
    if message is None:
        return

    text = get_string(message, "text")
    chat = parse_customer_chat(message)
    if chat is None or not text:
        return

    order_id = parse_order_start_parameter(text)
    if order_id is None:
        send_customer_message(
            chat.chat_id,
            "Напишіть /start з посилання з сайту Bloomify, щоб підписатися "
            "на оновлення конкретного замовлення.",
        )
        return

    subscribe_customer_to_order(chat, order_id)


def parse_order_start_parameter(text: str) -> int | None:
    match = ORDER_START_PATTERN.match(text.strip())
    if not match:
        return None

    raw_order_id = match.group("order_id") or match.group("plain_order_id")
    if raw_order_id is None:
        return None

    return int(raw_order_id)


def subscribe_customer_to_order(chat: TelegramCustomerChat, order_id: int) -> None:
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        send_customer_message(
            chat.chat_id,
            f"Замовлення #{order_id} не знайдено. Перевірте посилання з сайту.",
        )
        return

    with transaction.atomic():
        subscription, _created = TelegramOrderSubscription.objects.update_or_create(
            order=order,
            telegram_chat_id=chat.chat_id,
            defaults={
                "telegram_user_id": chat.user_id,
                "telegram_username": chat.username,
                "first_name": chat.first_name,
                "is_active": True,
                "last_notified_status": order.status,
                "last_notified_payment_status": order.payment_status,
            },
        )

    send_customer_message(
        chat.chat_id,
        build_customer_order_status_message(
            subscription.order,
            subscribed=True,
            recipient_name=resolve_customer_display_name(subscription),
        ),
    )


def notify_customer_order_subscribers(order: Order) -> None:
    subscriptions = TelegramOrderSubscription.objects.filter(
        order=order,
        is_active=True,
    )
    for subscription in subscriptions:
        if (
            subscription.last_notified_status == order.status
            and subscription.last_notified_payment_status == order.payment_status
        ):
            continue

        try:
            send_customer_message(
                subscription.telegram_chat_id,
                build_customer_order_status_message(
                    order,
                    subscribed=False,
                    recipient_name=resolve_customer_display_name(subscription),
                ),
            )
        except (CustomerTelegramBotError, TelegramNotificationError):
            logger.exception(
                "Failed to notify Telegram customer subscription %s",
                subscription.id,
            )
            continue

        subscription.last_notified_status = order.status
        subscription.last_notified_payment_status = order.payment_status
        subscription.save(
            update_fields=[
                "last_notified_status",
                "last_notified_payment_status",
                "updated_at",
            ]
        )


DEFAULT_CUSTOMER_NAME = "шановний клієнте"


def resolve_customer_display_name(subscription: TelegramOrderSubscription) -> str:
    """Pick the best name to address the customer: Telegram chat name first,
    then @username, then a polite default."""
    first_name = (subscription.first_name or "").strip()
    if first_name:
        return first_name

    username = (subscription.telegram_username or "").strip()
    if username:
        return username if username.startswith("@") else f"@{username}"

    return DEFAULT_CUSTOMER_NAME


def build_customer_order_status_message(
    order: Order,
    *,
    subscribed: bool,
    recipient_name: str | None = None,
) -> str:
    prefix = (
        "Ви підписалися на оновлення замовлення."
        if subscribed
        else "Статус замовлення оновлено."
    )

    lines: list[str] = []
    if recipient_name:
        lines.extend([f"Вітаємо, {escape(recipient_name)}!", ""])

    lines += [
        f"🌸 <b>{prefix}</b>",
        "",
        f"<b>Замовлення:</b> #{order.id}",
        f"<b>Статус замовлення:</b> {escape(get_customer_order_status_label(order))}",
        f"<b>Статус оплати:</b> {escape(get_customer_payment_status_label(order))}",
        f"<b>Сума:</b> {order.total:.2f} ₴",
    ]

    if order.status_note:
        lines.append(f"<b>Коментар:</b> {escape(order.status_note)}")

    if order.delivery_city or order.delivery_address:
        lines.extend(
            [
                "",
                "<b>Доставка</b>",
                f"Місто: {escape(order.delivery_city or 'Не вказано')}",
                f"Адреса: {escape(order.delivery_address or 'Не вказано')}",
            ]
        )

    return "\n".join(lines)


def get_customer_order_status_label(order: Order) -> str:
    return CUSTOMER_ORDER_STATUS_LABELS.get(order.status, order.get_status_display())


def get_customer_payment_status_label(order: Order) -> str:
    return CUSTOMER_PAYMENT_STATUS_LABELS.get(
        order.payment_status,
        order.get_payment_status_display(),
    )


def send_customer_message(chat_id: str, text: str) -> None:
    if not settings.TELEGRAM_CUSTOMER_BOT_TOKEN:
        raise CustomerTelegramBotError("TELEGRAM_CUSTOMER_BOT_TOKEN is not configured")

    send_telegram_message(
        chat_id,
        text,
        bot_token=settings.TELEGRAM_CUSTOMER_BOT_TOKEN,
    )


def parse_customer_chat(message: JsonMapping) -> TelegramCustomerChat | None:
    chat = get_mapping(message, "chat")
    if chat is None:
        return None

    raw_chat_id = chat.get("id")
    if not isinstance(raw_chat_id, int | str):
        return None

    from_user = get_mapping(message, "from")
    user_id = get_int(from_user, "id") if from_user else None
    username = get_string(from_user, "username") if from_user else ""
    first_name = get_string(from_user, "first_name") if from_user else ""

    return TelegramCustomerChat(
        chat_id=str(raw_chat_id),
        user_id=user_id,
        username=username,
        first_name=first_name,
    )


def get_mapping(payload: JsonMapping, key: str) -> JsonMapping | None:
    value = payload.get(key)
    return value if is_json_object(value) else None


def get_string(payload: JsonMapping | None, key: str) -> str:
    if payload is None:
        return ""

    value = payload.get(key)
    return value if isinstance(value, str) else ""


def get_int(payload: JsonMapping, key: str) -> int | None:
    value = payload.get(key)
    return value if isinstance(value, int) else None
