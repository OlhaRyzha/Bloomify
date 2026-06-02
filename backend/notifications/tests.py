from decimal import Decimal
from unittest.mock import patch

from django.test import Client, TestCase, override_settings

from notifications.tasks import build_order_paid_message
from notifications.views import build_sentry_alert_message
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


class SentryAlertWebhookTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_build_sentry_alert_message_escapes_payload(self):
        message = build_sentry_alert_message(
            {
                "title": "Broken <script>",
                "project": "bloomify-backend",
                "environment": "production",
                "level": "error",
                "url": "https://sentry.io/issues/123",
            }
        )

        self.assertIn("Sentry alert", message)
        self.assertIn("Broken &lt;script&gt;", message)
        self.assertIn("Project: bloomify-backend", message)
        self.assertIn("Environment: production", message)
        self.assertIn("Level: error", message)
        self.assertIn("Link: https://sentry.io/issues/123", message)

    @override_settings(
        SENTRY_ALERT_WEBHOOK_SECRET="sentry-secret",
        TELEGRAM_ADMIN_CHAT_ID="telegram-chat",
        TELEGRAM_BOT_TOKEN="telegram-token",
    )
    @patch("notifications.views.send_telegram_message")
    def test_sentry_alert_webhook_sends_telegram_message(self, send_message):
        response = self.client.post(
            "/notifications/sentry-alert?token=sentry-secret",
            {
                "title": "Backend error",
                "project": "bloomify-backend",
                "environment": "production",
                "level": "error",
                "url": "https://sentry.io/issues/123",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        send_message.assert_called_once()
        chat_id, text = send_message.call_args.args
        self.assertEqual(chat_id, "telegram-chat")
        self.assertIn("Backend error", text)
        self.assertIn("https://sentry.io/issues/123", text)

    @override_settings(
        SENTRY_ALERT_WEBHOOK_SECRET="sentry-secret",
        TELEGRAM_ADMIN_CHAT_ID="telegram-chat",
        TELEGRAM_BOT_TOKEN="telegram-token",
    )
    @patch("notifications.views.send_telegram_message")
    def test_sentry_alert_webhook_rejects_invalid_secret(self, send_message):
        response = self.client.post(
            "/notifications/sentry-alert?token=wrong",
            {"title": "Backend error"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        send_message.assert_not_called()
