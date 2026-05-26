from celery import shared_task
from django.conf import settings

from notifications.telegram import send_telegram_message
from shop.models import Order


@shared_task
def send_order_created_telegram_notification(order_id: int) -> str:
    order = Order.objects.get(id=order_id)

    message = build_order_created_message(order)

    send_telegram_message(
        chat_id=settings.TELEGRAM_ADMIN_CHAT_ID,
        text=message,
    )

    return f"Telegram notification sent for order #{order.id}"


def build_order_created_message(order: Order) -> str:
    return (
        "🌸 <b>New Bloomify order</b>\n\n"
        f"<b>Order:</b> #{order.id}\n"
        f"<b>Status:</b> {order.status}\n"
    )
