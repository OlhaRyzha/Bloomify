from decimal import Decimal

from django.utils.html import escape

from shop.models import Order


def build_order_paid_message(order: Order) -> str:
    return build_order_message(
        order,
        title="🌸 <b>Нове оплачене замовлення Bloomify</b>",
    )


def build_order_cash_on_delivery_message(order: Order) -> str:
    return build_order_message(
        order,
        title="🌸 <b>Нове замовлення Bloomify — оплата при отриманні</b>",
    )


def build_order_message(order: Order, *, title: str) -> str:
    items = order.items.select_related("product").all()
    item_lines = [
        (
            f"• {escape(str(item.product))} x {item.quantity} — "
            f"{format_money(item.total)}"
        )
        for item in items
    ]
    delivery_note = order.delivery_note.strip()

    lines = [
        title,
        "",
        f"<b>Замовлення:</b> #{order.id}",
        f"<b>Статус:</b> {escape(order.get_status_display())}",
        f"<b>Оплата:</b> {escape(order.get_payment_method_display())}",
        "",
        "<b>Клієнт</b>",
        f"Ім'я: {escape(order.customer_name)}",
        f"Телефон: {escape(order.customer_phone)}",
        f"Email: {escape(order.customer_email)}",
        "",
        "<b>Доставка</b>",
        f"Місто: {escape(order.delivery_city)}",
        f"Адреса: {escape(order.delivery_address)}",
    ]

    if delivery_note:
        lines.append(f"Коментар: {escape(delivery_note)}")

    lines.extend(
        [
            "",
            "<b>Що замовлено</b>",
            *(item_lines or ["• Немає позицій у замовленні"]),
            "",
            "<b>Сума</b>",
            f"Товари: {format_money(order.subtotal)}",
            f"Доставка: {format_money(order.delivery_cost)}",
            f"Разом: <b>{format_money(order.total)}</b>",
        ]
    )

    return "\n".join(lines)


def format_money(value: Decimal) -> str:
    return f"{value:.2f} ₴"
