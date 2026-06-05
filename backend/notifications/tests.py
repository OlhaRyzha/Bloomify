from decimal import Decimal
from unittest.mock import patch

from django.contrib.admin.sites import AdminSite
from django.forms import ModelForm
from django.test import Client, TestCase, override_settings
from django.test.client import RequestFactory

from notifications.customer_bot import (
    TelegramCustomerChat,
    notify_customer_order_subscribers,
    parse_order_start_parameter,
    subscribe_customer_to_order,
)
from notifications.messages import (
    build_order_cash_on_delivery_message,
    build_order_paid_message,
)
from notifications.models import TelegramOrderSubscription
from notifications.publisher import (
    NotificationPublisherError,
    publish_telegram_notification,
)
from notifications.views import (
    build_sentry_alert_idempotency_key,
    build_sentry_alert_message,
)
from shop.admin.orders import OrderAdmin
from shop.models.order import Order, OrderItem
from shop.tests.factories import create_order, create_product


class EmptyOrderForm(ModelForm):
    class Meta:
        model = Order
        fields: list[str] = []


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

    def test_build_order_cash_on_delivery_message_uses_delivery_payment_title(self):
        product = create_product(price=Decimal("1750.00"))
        order = create_order(
            customer_name="Ольга",
            customer_email="olha@example.com",
            customer_phone="+380671234567",
            delivery_city="Київ",
            delivery_address="Хрещатик 1",
            payment_method="cash_on_delivery",
            payment_status="not_required",
            status="pending",
            subtotal=Decimal("1750.00"),
            delivery_cost=Decimal("0.00"),
            total=Decimal("1750.00"),
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=1,
            unit_price=Decimal("1750.00"),
            total=Decimal("1750.00"),
        )

        message = build_order_cash_on_delivery_message(order)

        self.assertIn("Нове замовлення Bloomify — оплата при отриманні", message)
        self.assertIn("Оплата:</b> Payment on delivery", message)
        self.assertIn("Разом: <b>1750.00 ₴</b>", message)


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
    @patch("notifications.views.publish_telegram_notification")
    def test_sentry_alert_webhook_publishes_telegram_notification(
        self, publish_notification
    ):
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
        publish_notification.assert_called_once()
        kwargs = publish_notification.call_args.kwargs
        self.assertEqual(kwargs["event_type"], "sentry.alert")
        self.assertTrue(kwargs["idempotency_key"].startswith("sentry-alert:"))
        text = kwargs["text"]
        self.assertIn("Backend error", text)
        self.assertIn("https://sentry.io/issues/123", text)

    @override_settings(
        SENTRY_ALERT_WEBHOOK_SECRET="sentry-secret",
        TELEGRAM_ADMIN_CHAT_ID="telegram-chat",
        TELEGRAM_BOT_TOKEN="telegram-token",
    )
    @patch("notifications.views.publish_telegram_notification")
    def test_sentry_alert_webhook_rejects_invalid_secret(self, publish_notification):
        response = self.client.post(
            "/notifications/sentry-alert?token=wrong",
            {"title": "Backend error"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        publish_notification.assert_not_called()

    def test_build_sentry_alert_idempotency_key_is_stable(self):
        payload = {"url": "https://sentry.io/issues/123", "title": "Backend error"}

        self.assertEqual(
            build_sentry_alert_idempotency_key(payload),
            build_sentry_alert_idempotency_key(payload),
        )


class NotificationPublisherTest(TestCase):
    @override_settings(
        NOTIFICATION_PUBLISHER_WEBHOOK_URL="https://example.com/notify",
        NOTIFICATION_PUBLISHER_SECRET="secret",
        TELEGRAM_ADMIN_CHAT_ID="telegram-chat",
        TELEGRAM_BOT_TOKEN="telegram-token",
    )
    @patch("notifications.publisher.send_telegram_message")
    @patch("notifications.publisher.publish_to_notification_webhook")
    def test_publish_telegram_notification_falls_back_to_direct_send(
        self,
        publish_webhook,
        send_message,
    ):
        publish_webhook.side_effect = NotificationPublisherError("webhook down")

        publish_telegram_notification(
            event_type="order.paid",
            idempotency_key="order:1:paid",
            text="Test message",
        )

        publish_webhook.assert_called_once()
        send_message.assert_called_once_with("telegram-chat", "Test message")

    @override_settings(
        TELEGRAM_ADMIN_CHAT_ID="telegram-chat",
        TELEGRAM_BOT_TOKEN="telegram-token",
    )
    @patch("notifications.publisher.send_telegram_message")
    def test_publish_telegram_notification_sends_directly_when_no_webhook(
        self,
        send_message,
    ):
        publish_telegram_notification(
            event_type="order.paid",
            idempotency_key="order:1:paid",
            text="Test message",
        )

        send_message.assert_called_once_with("telegram-chat", "Test message")


class TelegramCustomerBotTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_parse_order_start_parameter_accepts_deep_link_payload(self):
        self.assertEqual(parse_order_start_parameter("/start order_28"), 28)
        self.assertEqual(parse_order_start_parameter("order_28"), 28)
        self.assertIsNone(parse_order_start_parameter("/start"))
        self.assertIsNone(parse_order_start_parameter("/start other_28"))

    @override_settings(TELEGRAM_CUSTOMER_BOT_TOKEN="customer-token")
    @patch("notifications.customer_bot.send_telegram_message")
    def test_subscribe_customer_to_order_creates_subscription(self, send_message):
        order = create_order(
            payment_status="paid",
            status="paid",
            total=Decimal("4300.00"),
            delivery_city="Kyiv",
            delivery_address="Urlivska",
        )
        chat = TelegramCustomerChat(
            chat_id="12345",
            user_id=99,
            username="olha",
            first_name="Olha",
        )

        subscribe_customer_to_order(chat, order.id)

        subscription = TelegramOrderSubscription.objects.get(order=order)
        self.assertEqual(subscription.telegram_chat_id, "12345")
        self.assertEqual(subscription.telegram_user_id, 99)
        self.assertEqual(subscription.telegram_username, "olha")
        self.assertEqual(subscription.last_notified_status, "paid")
        self.assertEqual(subscription.last_notified_payment_status, "paid")
        send_message.assert_called_once()
        args = send_message.call_args.args
        kwargs = send_message.call_args.kwargs
        self.assertEqual(args[0], "12345")
        self.assertIn(f"Замовлення:</b> #{order.id}", args[1])
        self.assertEqual(kwargs["bot_token"], "customer-token")

    @override_settings(
        TELEGRAM_CUSTOMER_BOT_TOKEN="customer-token",
        TELEGRAM_CUSTOMER_WEBHOOK_SECRET="telegram-secret",
    )
    @patch("notifications.customer_bot.send_telegram_message")
    def test_customer_webhook_subscribes_user_from_start_payload(self, send_message):
        order = create_order(payment_status="paid", status="paid")

        response = self.client.post(
            "/notifications/telegram/customer",
            {
                "message": {
                    "text": f"/start order_{order.id}",
                    "chat": {"id": 12345},
                    "from": {
                        "id": 99,
                        "username": "olha",
                        "first_name": "Olha",
                    },
                }
            },
            content_type="application/json",
            headers={"X-Telegram-Bot-Api-Secret-Token": "telegram-secret"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            TelegramOrderSubscription.objects.filter(
                order=order,
                telegram_chat_id="12345",
            ).exists()
        )
        send_message.assert_called_once()

    @override_settings(
        TELEGRAM_CUSTOMER_BOT_TOKEN="customer-token",
        TELEGRAM_CUSTOMER_WEBHOOK_SECRET="telegram-secret",
    )
    @patch("notifications.customer_bot.send_telegram_message")
    def test_customer_webhook_rejects_invalid_secret(self, send_message):
        response = self.client.post(
            "/notifications/telegram/customer",
            {"message": {"text": "/start order_1", "chat": {"id": 12345}}},
            content_type="application/json",
            headers={"X-Telegram-Bot-Api-Secret-Token": "wrong"},
        )

        self.assertEqual(response.status_code, 403)
        send_message.assert_not_called()

    @override_settings(TELEGRAM_CUSTOMER_BOT_TOKEN="customer-token")
    @patch("notifications.customer_bot.send_telegram_message")
    def test_notify_customer_order_subscribers_sends_only_changed_status(
        self,
        send_message,
    ):
        order = create_order(payment_status="pending", status="pending")
        TelegramOrderSubscription.objects.create(
            order=order,
            telegram_chat_id="12345",
            telegram_user_id=99,
            last_notified_status="pending",
            last_notified_payment_status="pending",
        )

        notify_customer_order_subscribers(order)
        send_message.assert_not_called()

        order.status = "out_for_delivery"
        order.status_note = "Кур'єр вже в дорозі до вас."
        order.payment_status = "paid"
        order.save(update_fields=["status", "status_note", "payment_status"])

        notify_customer_order_subscribers(order)

        send_message.assert_called_once()
        message = send_message.call_args.args[1]
        self.assertIn("Кур&#x27;єр вже в дорозі до вас", message)
        self.assertIn("Кур&#x27;єр вже в дорозі до вас.", message)
        subscription = TelegramOrderSubscription.objects.get(order=order)
        self.assertEqual(subscription.last_notified_status, "out_for_delivery")
        self.assertEqual(subscription.last_notified_payment_status, "paid")

    @override_settings(TELEGRAM_CUSTOMER_BOT_TOKEN="customer-token")
    @patch("notifications.customer_bot.send_telegram_message")
    def test_order_admin_status_change_notifies_customer_subscribers(
        self,
        send_message,
    ):
        order = create_order(payment_status="pending", status="pending")
        TelegramOrderSubscription.objects.create(
            order=order,
            telegram_chat_id="12345",
            telegram_user_id=99,
            last_notified_status="pending",
            last_notified_payment_status="pending",
        )
        order.status = "delivered"
        order.status_note = "Доставлено отримувачу."
        form = EmptyOrderForm(instance=order)
        request = RequestFactory().post("/admin/shop/order/")
        order_admin = OrderAdmin(Order, AdminSite())

        with self.captureOnCommitCallbacks(execute=True):
            order_admin.save_model(request, order, form, change=True)

        send_message.assert_called_once()
        subscription = TelegramOrderSubscription.objects.get(order=order)
        self.assertEqual(subscription.last_notified_status, "delivered")
