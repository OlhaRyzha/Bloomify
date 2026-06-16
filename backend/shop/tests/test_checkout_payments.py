from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.throttling import ScopedRateThrottle

from shop.models.order import Order
from shop.security.order_access import (
    create_order_access_token,
    hash_order_access_token,
)
from shop.services.liqpay import create_signature, decode_data, encode_data
from shop.tests.factories import (
    TEST_DELIVERY_NOTE,
    TEST_INVALID_BASE64_PAYLOAD,
    TEST_INVALID_PAYMENT_STATUS_TOKEN,
    TEST_LIQPAY_ORDER_ID,
    TEST_LIQPAY_PAYMENT_ID,
    TEST_UNKNOWN_PRODUCT_ID,
    build_checkout_payload,
    build_liqpay_callback_request,
    build_liqpay_provider_payload,
    build_payment_status_request,
    create_liqpay_order,
    create_product,
)


def authorize_payment_status(order: Order) -> str:
    token = create_order_access_token()
    order.payment_status_token_hash = hash_order_access_token(token)
    order.save(update_fields=["payment_status_token_hash"])
    return token


class CheckoutPaymentsTest(TestCase):
    def setUp(self):
        self.product = create_product(price=Decimal("1750.00"))

    @override_settings(
        LIQPAY_PUBLIC_KEY="sandbox_public_key",
        LIQPAY_PRIVATE_KEY="sandbox_private_key",
        LIQPAY_RESULT_URL="http://localhost:3000/checkout",
        LIQPAY_SERVER_URL="http://localhost:8000/payments/liqpay/callback",
    )
    def test_checkout_creates_order_and_liqpay_payload(self):
        response = self.client.post(
            "/orders/checkout",
            data=build_checkout_payload(
                product_id=self.product.pk,
                payment_method="card",
                quantity=2,
                locale="uk",
                delivery_note=TEST_DELIVERY_NOTE,
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["paymentProvider"], "liqpay")
        self.assertEqual(body["paymentStatus"], "pending")
        self.assertEqual(body["paymentMethod"], "card")
        self.assertIsInstance(body["paymentStatusToken"], str)
        self.assertGreater(len(body["paymentStatusToken"]), 20)
        self.assertIn("data", body["liqpay"])
        self.assertIn("signature", body["liqpay"])

        order = Order.objects.get(pk=body["orderId"])
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.subtotal, Decimal("3500.00"))
        self.assertEqual(order.delivery_cost, Decimal("0.00"))
        self.assertEqual(order.total, Decimal("3500.00"))

        liqpay_payload = decode_data(body["liqpay"]["data"])
        self.assertEqual(liqpay_payload["public_key"], "sandbox_public_key")
        self.assertEqual(liqpay_payload["version"], 7)
        self.assertEqual(liqpay_payload["sandbox"], 1)
        self.assertEqual(liqpay_payload["amount"], "3500.00")
        self.assertEqual(liqpay_payload["order_id"], order.liqpay_order_id)
        self.assertEqual(
            liqpay_payload["result_url"],
            "http://localhost:3000/uk/checkout?"
            f"orderId={order.pk}&orderToken={body['paymentStatusToken']}",
        )
        self.assertEqual(liqpay_payload["paytypes"], "card")

    @override_settings(
        LIQPAY_PUBLIC_KEY="sandbox_public_key",
        LIQPAY_PRIVATE_KEY="sandbox_private_key",
        LIQPAY_RESULT_URL="http://localhost:3000/en/checkout",
        LIQPAY_SERVER_URL="http://localhost:8000/payments/liqpay/callback",
    )
    def test_checkout_keeps_existing_liqpay_result_url_locale(self):
        response = self.client.post(
            "/orders/checkout",
            data=build_checkout_payload(
                product_id=self.product.pk,
                payment_method="card",
                locale="uk",
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        order = Order.objects.get(pk=body["orderId"])
        liqpay_payload = decode_data(body["liqpay"]["data"])
        self.assertEqual(
            liqpay_payload["result_url"],
            "http://localhost:3000/en/checkout?"
            f"orderId={order.pk}&orderToken={body['paymentStatusToken']}",
        )

    def test_checkout_creates_cash_on_delivery_order_without_liqpay_payload(self):
        with patch(
            "shop.views.orders.publish_cash_on_delivery_notification_safely"
        ) as enqueue_notification:
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(
                    "/orders/checkout",
                    data=build_checkout_payload(
                        product_id=self.product.pk,
                        payment_method="cash_on_delivery",
                    ),
                    content_type="application/json",
                )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["paymentProvider"], "")
        self.assertEqual(body["paymentStatus"], "not_required")
        self.assertIsNone(body["liqpay"])
        enqueue_notification.assert_called_once_with(body["orderId"])

    @override_settings(
        LIQPAY_PUBLIC_KEY="sandbox_public_key",
        LIQPAY_PRIVATE_KEY="sandbox_private_key",
    )
    def test_checkout_does_not_notify_before_payment(self):
        with patch(
            "shop.views.orders.publish_order_paid_notification_safely"
        ) as enqueue_paid_notification:
            with patch(
                "shop.views.orders.publish_cash_on_delivery_notification_safely"
            ) as enqueue_cash_notification:
                response = self.client.post(
                    "/orders/checkout",
                    data=build_checkout_payload(
                        product_id=self.product.pk,
                        payment_method="card",
                    ),
                    content_type="application/json",
                )

        self.assertEqual(response.status_code, 201)
        enqueue_paid_notification.assert_not_called()
        enqueue_cash_notification.assert_not_called()

    def test_checkout_does_not_notify_cash_on_delivery_when_create_fails(self):
        with patch(
            "shop.views.orders.publish_cash_on_delivery_notification_safely"
        ) as enqueue_notification:
            response = self.client.post(
                "/orders/checkout",
                data=build_checkout_payload(
                    product_id=TEST_UNKNOWN_PRODUCT_ID,
                    payment_method="cash_on_delivery",
                ),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        enqueue_notification.assert_not_called()

    @override_settings(
        LIQPAY_PUBLIC_KEY="sandbox_public_key",
        LIQPAY_PRIVATE_KEY="sandbox_private_key",
    )
    def test_liqpay_callback_marks_order_paid_without_notification(self):
        order = create_liqpay_order()
        data = encode_data(build_liqpay_provider_payload(order))
        with patch(
            "shop.views.orders.publish_order_paid_notification_safely"
        ) as enqueue_notification:
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(
                    "/payments/liqpay/callback",
                    data=build_liqpay_callback_request(
                        data=data,
                        signature=create_signature(data),
                    ),
                )

        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "paid")
        self.assertEqual(order.status, "paid")
        self.assertEqual(order.liqpay_payment_id, str(TEST_LIQPAY_PAYMENT_ID))
        enqueue_notification.assert_not_called()

    @override_settings(
        LIQPAY_PUBLIC_KEY="sandbox_public_key",
        LIQPAY_PRIVATE_KEY="sandbox_private_key",
    )
    def test_liqpay_sandbox_callback_does_not_notify_before_return_sync(self):
        order = create_liqpay_order()
        data = encode_data(build_liqpay_provider_payload(order, status="sandbox"))

        with patch(
            "shop.views.orders.publish_order_paid_notification_safely"
        ) as enqueue_notification:
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(
                    "/payments/liqpay/callback",
                    data=build_liqpay_callback_request(
                        data=data,
                        signature=create_signature(data),
                    ),
                )

        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "pending")
        self.assertEqual(order.status, "pending")
        enqueue_notification.assert_not_called()

    @override_settings(
        LIQPAY_PUBLIC_KEY="sandbox_public_key",
        LIQPAY_PRIVATE_KEY="sandbox_private_key",
    )
    def test_liqpay_callback_does_not_notify_already_paid_order(self):
        order = create_liqpay_order(payment_status="paid", status="paid")
        data = encode_data(build_liqpay_provider_payload(order))

        with patch(
            "shop.views.orders.publish_order_paid_notification_safely"
        ) as enqueue_notification:
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(
                    "/payments/liqpay/callback",
                    data=build_liqpay_callback_request(
                        data=data,
                        signature=create_signature(data),
                    ),
                )

        self.assertEqual(response.status_code, 200)
        enqueue_notification.assert_not_called()

    @override_settings(
        LIQPAY_PUBLIC_KEY="sandbox_public_key",
        LIQPAY_PRIVATE_KEY="sandbox_private_key",
    )
    def test_liqpay_status_sync_marks_order_paid_and_notifies_after_return(self):
        order = create_liqpay_order()
        token = authorize_payment_status(order)

        with patch(
            "shop.services.liqpay.LIQPAY_PROVIDER.sync_payment_status",
            return_value=build_liqpay_provider_payload(order),
        ):
            with patch(
                "shop.views.orders.publish_order_paid_notification_safely"
            ) as enqueue_notification:
                with self.captureOnCommitCallbacks(execute=True):
                    response = self.client.post(
                        f"/orders/{order.pk}/payment-status",
                        data=build_payment_status_request(token),
                        content_type="application/json",
                    )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["paymentStatus"], "paid")
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "paid")
        self.assertEqual(order.status, "paid")
        self.assertEqual(order.liqpay_payment_id, str(TEST_LIQPAY_PAYMENT_ID))
        self.assertTrue(order.payment_payload["paid_telegram_notification_sent"])
        enqueue_notification.assert_called_once_with(order.id)

    def test_liqpay_status_sync_notifies_paid_callback_order_after_return(self):
        order = create_liqpay_order(
            payment_status="paid",
            status="paid",
            payment_payload={"status": "success"},
        )
        token = authorize_payment_status(order)

        with patch(
            "shop.services.liqpay.LIQPAY_PROVIDER.sync_payment_status"
        ) as sync_payment_status:
            with patch(
                "shop.views.orders.publish_order_paid_notification_safely"
            ) as enqueue_notification:
                with self.captureOnCommitCallbacks(execute=True):
                    response = self.client.post(
                        f"/orders/{order.pk}/payment-status",
                        data=build_payment_status_request(token),
                        content_type="application/json",
                    )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["paymentStatus"], "paid")
        sync_payment_status.assert_not_called()
        order.refresh_from_db()
        self.assertTrue(order.payment_payload["paid_telegram_notification_sent"])
        enqueue_notification.assert_called_once_with(order.id)

    def test_liqpay_status_sync_does_not_duplicate_paid_notification(self):
        order = create_liqpay_order(
            payment_status="paid",
            status="paid",
            payment_payload={"paid_telegram_notification_sent": True},
        )
        token = authorize_payment_status(order)

        with patch(
            "shop.services.liqpay.LIQPAY_PROVIDER.sync_payment_status"
        ) as sync_payment_status:
            with patch(
                "shop.views.orders.publish_order_paid_notification_safely"
            ) as enqueue_notification:
                response = self.client.post(
                    f"/orders/{order.pk}/payment-status",
                    data=build_payment_status_request(token),
                    content_type="application/json",
                )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["paymentStatus"], "paid")
        sync_payment_status.assert_not_called()
        enqueue_notification.assert_not_called()

    def test_liqpay_status_sync_rejects_missing_token(self):
        order = create_liqpay_order()

        response = self.client.post(f"/orders/{order.pk}/payment-status")

        self.assertEqual(response.status_code, 400)

    def test_liqpay_status_sync_rejects_invalid_token(self):
        order = create_liqpay_order()
        authorize_payment_status(order)

        response = self.client.post(
            f"/orders/{order.pk}/payment-status",
            data=build_payment_status_request(TEST_INVALID_PAYMENT_STATUS_TOKEN),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_payment_status_rejects_token_from_different_order(self):
        order_a = create_liqpay_order()
        order_b = create_liqpay_order()
        token_a = authorize_payment_status(order_a)
        authorize_payment_status(order_b)

        response = self.client.post(
            f"/orders/{order_b.pk}/payment-status",
            data=build_payment_status_request(token_a),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_checkout_endpoint_is_rate_limited(self):
        payload = build_checkout_payload(
            product_id=self.product.pk,
            payment_method="cash_on_delivery",
        )

        with patch.object(
            ScopedRateThrottle,
            "THROTTLE_RATES",
            {"checkout": "1/minute", "payment_status": "60/hour"},
        ):
            first_response = self.client.post(
                "/orders/checkout",
                data=payload,
                content_type="application/json",
                REMOTE_ADDR="203.0.113.10",
            )
            second_response = self.client.post(
                "/orders/checkout",
                data=payload,
                content_type="application/json",
                REMOTE_ADDR="203.0.113.10",
            )

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 429)

    def test_payment_status_endpoint_is_rate_limited(self):
        order = create_liqpay_order(
            payment_status="paid",
            status="paid",
            payment_payload={"paid_telegram_notification_sent": True},
        )
        token = authorize_payment_status(order)

        with patch.object(
            ScopedRateThrottle,
            "THROTTLE_RATES",
            {"checkout": "20/hour", "payment_status": "1/minute"},
        ):
            first_response = self.client.post(
                f"/orders/{order.pk}/payment-status",
                data=build_payment_status_request(token),
                content_type="application/json",
                REMOTE_ADDR="203.0.113.11",
            )
            second_response = self.client.post(
                f"/orders/{order.pk}/payment-status",
                data=build_payment_status_request(token),
                content_type="application/json",
                REMOTE_ADDR="203.0.113.11",
            )

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 429)

    @override_settings(
        LIQPAY_PUBLIC_KEY="sandbox_public_key",
        LIQPAY_PRIVATE_KEY="sandbox_private_key",
    )
    def test_liqpay_callback_rejects_invalid_signature(self):
        data = encode_data(
            {
                "order_id": TEST_LIQPAY_ORDER_ID,
                "status": "success",
            }
        )

        response = self.client.post(
            "/payments/liqpay/callback",
            data=build_liqpay_callback_request(data=data, signature="invalid"),
        )

        self.assertEqual(response.status_code, 400)

    @override_settings(
        LIQPAY_PUBLIC_KEY="sandbox_public_key",
        LIQPAY_PRIVATE_KEY="sandbox_private_key",
    )
    def test_liqpay_callback_rejects_invalid_data_payload(self):
        data = TEST_INVALID_BASE64_PAYLOAD

        response = self.client.post(
            "/payments/liqpay/callback",
            data=build_liqpay_callback_request(
                data=data,
                signature=create_signature(data),
            ),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Invalid LiqPay data payload.")
