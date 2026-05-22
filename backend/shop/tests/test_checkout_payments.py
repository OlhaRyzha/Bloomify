from decimal import Decimal

from django.test import TestCase, override_settings

from shop.models.order import Order
from shop.services.liqpay import create_signature, decode_data, encode_data
from shop.tests.factories import create_order, create_product


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
            data={
                "customerName": "Tom Smith",
                "email": "tom@example.com",
                "phone": "+380671234567",
                "city": "Kyiv",
                "address": "Khreshchatyk 1",
                "deliveryNote": "Call before delivery",
                "paymentMethod": "card",
                "items": [{"id": self.product.pk, "quantity": 2}],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["paymentProvider"], "liqpay")
        self.assertEqual(body["paymentStatus"], "pending")
        self.assertEqual(body["paymentMethod"], "card")
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
        self.assertEqual(liqpay_payload["paytypes"], "card")

    @override_settings(LIQPAY_PRIVATE_KEY="a4825234f4bae72a0be04eafe9e8e2bada209255")
    def test_liqpay_signature_matches_documentation_example(self):
        data = (
            "eyJwdWJsaWNfa2V5IjoiaTAwMDAwMDAwIiwidmVyc2lvbiI6NywiYWN0aW9u"
            "IjoicGF5IiwiYW1vdW50IjoiMyIsImN1cnJlbmN5IjoiVUFIIiwiZGVzY3Jp"
            "cHRpb24iOiJ0ZXN0Iiwib3JkZXJfaWQiOiIwMDAwMDEifQ=="
        )

        self.assertEqual(
            create_signature(data),
            "0adgJ8F2Ds5HCVkcz4AlmdLMRoIJf7IxsL3QmeFRz/s=",
        )

    def test_checkout_creates_cash_on_delivery_order_without_liqpay_payload(self):
        response = self.client.post(
            "/orders/checkout",
            data={
                "customerName": "Tom Smith",
                "email": "tom@example.com",
                "phone": "+380671234567",
                "city": "Kyiv",
                "address": "Khreshchatyk 1",
                "paymentMethod": "cash_on_delivery",
                "items": [{"id": self.product.pk, "quantity": 1}],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["paymentProvider"], "")
        self.assertEqual(body["paymentStatus"], "not_required")
        self.assertIsNone(body["liqpay"])

    @override_settings(
        LIQPAY_PUBLIC_KEY="sandbox_public_key",
        LIQPAY_PRIVATE_KEY="sandbox_private_key",
    )
    def test_liqpay_callback_marks_order_paid_after_signature_verification(self):
        order = create_order(
            payment_provider="liqpay",
            payment_method="card",
            payment_status="pending",
            status="pending",
            liqpay_order_id="bloomify-1",
            total=Decimal("1750.00"),
        )
        data = encode_data(
            {
                "order_id": order.liqpay_order_id,
                "status": "success",
                "payment_id": 123456,
            }
        )

        response = self.client.post(
            "/payments/liqpay/callback",
            data={
                "data": data,
                "signature": create_signature(data),
            },
        )

        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "paid")
        self.assertEqual(order.status, "paid")
        self.assertEqual(order.liqpay_payment_id, "123456")

    @override_settings(
        LIQPAY_PUBLIC_KEY="sandbox_public_key",
        LIQPAY_PRIVATE_KEY="sandbox_private_key",
    )
    def test_liqpay_callback_rejects_invalid_signature(self):
        data = encode_data({"order_id": "bloomify-1", "status": "success"})

        response = self.client.post(
            "/payments/liqpay/callback",
            data={
                "data": data,
                "signature": "invalid",
            },
        )

        self.assertEqual(response.status_code, 400)
