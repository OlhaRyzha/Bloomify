from decimal import Decimal

from django.test import TestCase

from notifications.tasks import build_order_paid_message
from shop.models.order import OrderItem
from shop.tests.factories import create_order, create_product


class TelegramOrderMessageTest(TestCase):
    def test_build_order_paid_message_includes_order_details(self):
        product = create_product(price=Decimal("1650.00"))
        product.set_current_language("uk")
        product.name = "Біла гармонія"
        product.save()
        order = create_order(
            customer_name="Ольга",
            customer_email="olha@example.com",
            customer_phone="+380671234567",
            delivery_city="Київ",
            delivery_address="Хрещатик 1",
            delivery_note="Подзвонити перед доставкою",
            payment_method="card",
            payment_status="paid",
            status="paid",
            subtotal=Decimal("3300.00"),
            delivery_cost=Decimal("0.00"),
            total=Decimal("3300.00"),
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=2,
            unit_price=Decimal("1650.00"),
            total=Decimal("3300.00"),
        )

        message = build_order_paid_message(order)

        self.assertIn("Нове оплачене замовлення Bloomify", message)
        self.assertIn(f"Замовлення:</b> #{order.id}", message)
        self.assertIn("Біла гармонія x 2 — 3300.00 ₴", message)
        self.assertIn("Адреса: Хрещатик 1", message)
        self.assertIn("Коментар: Подзвонити перед доставкою", message)
        self.assertIn("Разом: <b>3300.00 ₴</b>", message)
