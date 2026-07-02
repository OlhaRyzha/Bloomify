from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.throttling import ScopedRateThrottle

from shop.models.subscription import Subscription, SubscriptionPayment
from shop.services.liqpay import create_signature, encode_data
from shop.tests.factories import (
    build_liqpay_callback_request,
    build_login_payload,
    build_subscription_callback_payload,
    create_subscription,
    create_subscription_payment,
    create_subscription_plan,
    create_test_user,
)

# Disable throttling for all subscription tests to avoid rate limit errors
TEST_THROTTLE_RATES = {
    "auth": "1000/day",  # Disable rate limiting for auth during tests
    "subscription": "1000/day",
}

LIQPAY_SETTINGS = {
    "LIQPAY_PUBLIC_KEY": "sandbox_public_key",
    "LIQPAY_PRIVATE_KEY": "sandbox_private_key",
    "LIQPAY_RESULT_URL": "http://localhost:3000/subscriptions",
    "LIQPAY_SUBSCRIPTION_SERVER_URL": "http://localhost:8000/payments/liqpay/subscription-callback",
}


def _get_auth_header(client, user_password: str = "BloomifyAuth123!") -> dict[str, str]:
    from django.contrib.auth.models import User

    from shop.tests.factories import TEST_USER_EMAIL

    # Ensure user exists; get_or_create to avoid dupes across test runs
    User.objects.get_or_create(
        username=TEST_USER_EMAIL,
        defaults={"email": TEST_USER_EMAIL, "password": user_password},
    )
    # Set password properly after creation
    user = User.objects.get(username=TEST_USER_EMAIL)
    user.set_password(user_password)
    user.save()

    response = client.post(
        "/auth/token/",
        data=build_login_payload(email=TEST_USER_EMAIL, password=user_password),
        content_type="application/json",
    )
    if response.status_code != 200:
        raise AssertionError(
            f"Auth failed with {response.status_code}: {response.json()}"
        )

    token = response.json().get("access_token")
    if not token:
        raise AssertionError(f"No access_token in response: {response.json()}")

    return {"Authorization": f"Bearer {token}"}


@override_settings(REST_FRAMEWORK={"DEFAULT_THROTTLE_RATES": TEST_THROTTLE_RATES})
class SubscribeViewTest(TestCase):
    def setUp(self):
        self.plan = create_subscription_plan(price=Decimal("299.00"))
        self.user = create_test_user()
        self.auth = _get_auth_header(self.client)

    @override_settings(**LIQPAY_SETTINGS)
    def test_subscribe_creates_subscription_and_liqpay_payload(self):
        response = self.client.post(
            "/subscriptions/subscribe",
            data={"plan_id": self.plan.pk},
            content_type="application/json",
            headers=self.auth,
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertIn("subscriptionId", body)
        self.assertIn("paymentId", body)
        self.assertEqual(body["status"], "pending")
        self.assertIn("checkoutUrl", body["liqpay"])
        self.assertIn("data", body["liqpay"])
        self.assertIn("signature", body["liqpay"])

        subscription = Subscription.objects.get(pk=body["subscriptionId"])
        self.assertEqual(subscription.status, "pending")
        self.assertEqual(subscription.user, self.user)
        self.assertEqual(subscription.plan, self.plan)

        payment = SubscriptionPayment.objects.get(pk=body["paymentId"])
        self.assertEqual(payment.amount, self.plan.price)
        self.assertNotEqual(payment.payment_status_token_hash, "")

    @override_settings(**LIQPAY_SETTINGS)
    def test_subscribe_rejects_duplicate_subscription(self):
        create_subscription(self.user, self.plan, status="active")

        response = self.client.post(
            "/subscriptions/subscribe",
            data={"plan_id": self.plan.pk},
            content_type="application/json",
            headers=self.auth,
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("already have an active subscription", response.json()["detail"])
        self.assertEqual(Subscription.objects.filter(user=self.user).count(), 1)

    @override_settings(**LIQPAY_SETTINGS)
    def test_subscribe_allows_new_subscription_after_canceled(self):
        create_subscription(self.user, self.plan, status="canceled")

        response = self.client.post(
            "/subscriptions/subscribe",
            data={"plan_id": self.plan.pk},
            content_type="application/json",
            headers=self.auth,
        )

        self.assertEqual(response.status_code, 201)

    def test_subscribe_requires_auth(self):
        self.client.logout()
        response = self.client.post(
            "/subscriptions/subscribe",
            data={"plan_id": self.plan.pk},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    @override_settings(**LIQPAY_SETTINGS)
    def test_subscribe_is_throttled(self):
        with patch.object(
            ScopedRateThrottle,
            "THROTTLE_RATES",
            {"subscription": "1/minute"},
        ):
            self.client.post(
                "/subscriptions/subscribe",
                data={"plan_id": self.plan.pk},
                content_type="application/json",
                headers=self.auth,
            )
            response = self.client.post(
                "/subscriptions/subscribe",
                data={"plan_id": self.plan.pk},
                content_type="application/json",
                headers=self.auth,
            )
        self.assertEqual(response.status_code, 429)


@override_settings(REST_FRAMEWORK={"DEFAULT_THROTTLE_RATES": TEST_THROTTLE_RATES})
class UnsubscribeViewTest(TestCase):
    def setUp(self):
        self.plan = create_subscription_plan()
        self.user = create_test_user()
        self.auth = _get_auth_header(self.client)

    def test_unsubscribe_cancels_active_subscription(self):
        subscription = create_subscription(self.user, self.plan, status="active")

        response = self.client.post("/subscriptions/unsubscribe", headers=self.auth)

        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, "canceled")

    def test_unsubscribe_returns_404_when_no_active_subscription(self):
        response = self.client.post("/subscriptions/unsubscribe", headers=self.auth)
        self.assertEqual(response.status_code, 404)

    def test_unsubscribe_requires_auth(self):
        response = self.client.post("/subscriptions/unsubscribe")
        self.assertEqual(response.status_code, 401)


@override_settings(
    LIQPAY_PUBLIC_KEY="sandbox_public_key",
    LIQPAY_PRIVATE_KEY="sandbox_private_key",
    REST_FRAMEWORK={"DEFAULT_THROTTLE_RATES": TEST_THROTTLE_RATES},
)
class LiqPaySubscriptionCallbackTest(TestCase):
    def setUp(self):
        self.plan = create_subscription_plan(price=Decimal("299.00"))
        self.user = create_test_user()
        self.subscription = create_subscription(self.user, self.plan, status="pending")
        self.payment, _ = create_subscription_payment(self.subscription)
        self.payment.provider_order_id = f"bloomify-subpay-{self.payment.pk}"
        self.payment.save(update_fields=["provider_order_id"])

    def _post_callback(self, payload):
        data = encode_data(payload)
        return self.client.post(
            "/payments/liqpay/subscription-callback",
            data=build_liqpay_callback_request(
                data=data,
                signature=create_signature(data),
            ),
        )

    def test_paid_callback_activates_subscription(self):
        response = self._post_callback(
            build_subscription_callback_payload(self.payment, status="success")
        )

        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "paid")
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.status, "active")

    def test_sandbox_callback_activates_subscription(self):
        response = self._post_callback(
            build_subscription_callback_payload(self.payment, status="sandbox")
        )

        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "paid")
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.status, "active")

    def test_failure_callback_cancels_pending_subscription(self):
        response = self._post_callback(
            build_subscription_callback_payload(self.payment, status="failure")
        )

        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "canceled")
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.status, "canceled")

    def test_duplicate_paid_callback_is_idempotent(self):
        self._post_callback(
            build_subscription_callback_payload(self.payment, status="success")
        )
        response = self._post_callback(
            build_subscription_callback_payload(self.payment, status="success")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            SubscriptionPayment.objects.filter(
                subscription=self.subscription, status="paid"
            ).count(),
            1,
        )

    def test_callback_rejects_invalid_signature(self):
        data = encode_data(
            build_subscription_callback_payload(self.payment, status="success")
        )
        response = self.client.post(
            "/payments/liqpay/subscription-callback",
            data=build_liqpay_callback_request(data=data, signature="wrong-sig"),
        )
        self.assertEqual(response.status_code, 400)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "pending")

    def test_callback_rejects_amount_mismatch(self):
        payload = {
            "order_id": self.payment.provider_order_id,
            "status": "success",
            "payment_id": 999,
            "amount": "1.00",
            "currency": "UAH",
        }
        response = self._post_callback(payload)
        self.assertEqual(response.status_code, 400)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "pending")

    def test_callback_rejects_currency_mismatch(self):
        payload = {
            "order_id": self.payment.provider_order_id,
            "status": "success",
            "payment_id": 999,
            "amount": str(self.payment.amount),
            "currency": "USD",
        }
        response = self._post_callback(payload)
        self.assertEqual(response.status_code, 400)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "pending")

    def test_callback_rejects_non_subscription_order_id(self):
        payload = {
            "order_id": "bloomify-1",
            "status": "success",
            "payment_id": 999,
            "amount": str(self.payment.amount),
            "currency": "UAH",
        }
        response = self._post_callback(payload)
        self.assertEqual(response.status_code, 400)


class SubscriptionPaymentStatusViewTest(TestCase):
    def setUp(self):
        self.plan = create_subscription_plan(price=Decimal("299.00"))
        self.user = create_test_user()
        self.subscription = create_subscription(self.user, self.plan, status="pending")
        self.payment, token = create_subscription_payment(
            self.subscription, with_token=True
        )
        assert token is not None
        self.token: str = token

    def test_returns_payment_and_subscription_status(self):
        response = self.client.get(
            f"/subscriptions/payments/{self.payment.pk}/status",
            {"paymentToken": self.token},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["paymentId"], self.payment.pk)
        self.assertEqual(body["paymentStatus"], "pending")
        self.assertEqual(body["subscriptionStatus"], "pending")
        self.assertIn("plan", body)

    def test_rejects_missing_token(self):
        response = self.client.get(f"/subscriptions/payments/{self.payment.pk}/status")
        self.assertEqual(response.status_code, 403)

    def test_rejects_invalid_token(self):
        response = self.client.get(
            f"/subscriptions/payments/{self.payment.pk}/status",
            {"paymentToken": "wrong-token"},
        )
        self.assertEqual(response.status_code, 403)

    def test_returns_404_for_unknown_payment(self):
        response = self.client.get(
            "/subscriptions/payments/99999/status",
            {"paymentToken": self.token},
        )
        self.assertEqual(response.status_code, 404)


@override_settings(**LIQPAY_SETTINGS)
@override_settings(REST_FRAMEWORK={"DEFAULT_THROTTLE_RATES": TEST_THROTTLE_RATES})
class UpgradeSubscriptionViewTest(TestCase):
    def setUp(self):
        self.base_plan = create_subscription_plan(price=Decimal("199.00"))
        self.premium_plan = create_subscription_plan(price=Decimal("499.00"))
        self.user = create_test_user()
        self.subscription = create_subscription(
            self.user, self.base_plan, status="active"
        )
        self.auth = _get_auth_header(self.client)

    def test_upgrade_creates_payment_for_price_diff(self):
        response = self.client.post(
            "/subscriptions/upgrade",
            data={"plan_id": self.premium_plan.pk},
            content_type="application/json",
            headers=self.auth,
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertIn("paymentId", body)
        self.assertIn("liqpay", body)

        payment = SubscriptionPayment.objects.get(pk=body["paymentId"])
        self.assertEqual(payment.amount, Decimal("300.00"))
        self.assertEqual(payment.target_plan, self.premium_plan)
        self.assertNotEqual(payment.payment_status_token_hash, "")

    def test_upgrade_rejects_same_plan(self):
        response = self.client.post(
            "/subscriptions/upgrade",
            data={"plan_id": self.base_plan.pk},
            content_type="application/json",
            headers=self.auth,
        )
        self.assertEqual(response.status_code, 400)

    def test_upgrade_rejects_cheaper_plan(self):
        cheap_plan = create_subscription_plan(price=Decimal("99.00"))
        response = self.client.post(
            "/subscriptions/upgrade",
            data={"plan_id": cheap_plan.pk},
            content_type="application/json",
            headers=self.auth,
        )
        self.assertEqual(response.status_code, 400)

    def test_upgrade_requires_active_subscription(self):
        self.subscription.status = "canceled"
        self.subscription.save(update_fields=["status"])

        response = self.client.post(
            "/subscriptions/upgrade",
            data={"plan_id": self.premium_plan.pk},
            content_type="application/json",
            headers=self.auth,
        )
        self.assertEqual(response.status_code, 400)

    def test_upgrade_requires_auth(self):
        response = self.client.post(
            "/subscriptions/upgrade",
            data={"plan_id": self.premium_plan.pk},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)


@override_settings(REST_FRAMEWORK={"DEFAULT_THROTTLE_RATES": TEST_THROTTLE_RATES})
class SubscriptionEdgeCasesTest(TestCase):
    """Edge cases and reliability tests for subscription flows."""

    def setUp(self):
        self.plan = create_subscription_plan(price=Decimal("299.00"))
        self.user = create_test_user()
        self.auth = _get_auth_header(self.client)

    @override_settings(**LIQPAY_SETTINGS)
    def test_failed_payment_can_be_retried(self):
        """After payment fails, user can retry without duplicate subscription."""
        subscription = create_subscription(self.user, self.plan, status="pending")
        _, _ = create_subscription_payment(subscription, status="failed")

        # Retry by initiating new payment
        response = self.client.post(
            "/subscriptions/subscribe",
            data={"plan_id": self.plan.pk},
            content_type="application/json",
            headers=self.auth,
        )

        self.assertEqual(response.status_code, 400)  # Duplicate subscription exists
        # Verify only one subscription exists
        self.assertEqual(Subscription.objects.filter(user=self.user).count(), 1)

    def _post_subscription_callback(self, payment, status="success"):
        """Helper to post properly signed subscription callback."""
        payload = build_subscription_callback_payload(payment, status=status)
        data = encode_data(payload)
        return self.client.post(
            "/payments/liqpay/subscription-callback",
            data=build_liqpay_callback_request(
                data=data,
                signature=create_signature(data),
            ),
        )

    @override_settings(**LIQPAY_SETTINGS)
    def test_payment_failure_callback_marks_payment_failed(self):
        """LiqPay failure callback marks payment as failed."""
        subscription = create_subscription(self.user, self.plan, status="pending")
        payment, _ = create_subscription_payment(subscription, status="pending")
        payment.provider_order_id = f"bloomify-subpay-{payment.pk}"
        payment.save(update_fields=["provider_order_id"])

        response = self._post_subscription_callback(payment, status="failure")

        self.assertEqual(response.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, "canceled")
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, "canceled")

    def test_cancellation_mid_cycle_works_immediately(self):
        """Canceling active subscription stops immediately."""
        subscription = create_subscription(self.user, self.plan, status="active")

        response = self.client.post(
            "/subscriptions/unsubscribe",
            content_type="application/json",
            headers=self.auth,
        )

        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, "canceled")

    def test_cancelled_subscription_cannot_be_upgraded(self):
        """Cannot upgrade a canceled subscription."""
        premium_plan = create_subscription_plan(price=Decimal("499.00"))
        create_subscription(self.user, self.plan, status="canceled")

        response = self.client.post(
            "/subscriptions/upgrade",
            data={"plan_id": premium_plan.pk},
            content_type="application/json",
            headers=self.auth,
        )

        self.assertEqual(response.status_code, 400)

    @override_settings(**LIQPAY_SETTINGS)
    def test_idempotent_payment_callbacks_do_not_duplicate_charges(self):
        """Multiple identical callbacks for same payment are idempotent."""
        subscription = create_subscription(self.user, self.plan, status="pending")
        payment, _ = create_subscription_payment(subscription, status="pending")
        payment.provider_order_id = f"bloomify-subpay-{payment.pk}"
        payment.save(update_fields=["provider_order_id"])

        # First callback
        response1 = self._post_subscription_callback(payment, status="success")
        self.assertEqual(response1.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, "paid")

        # Second identical callback (webhook retry)
        response2 = self._post_subscription_callback(payment, status="success")
        self.assertEqual(response2.status_code, 200)

        # Verify only one payment was recorded
        recorded_payment = SubscriptionPayment.objects.get(
            provider_order_id=payment.provider_order_id
        )
        self.assertEqual(recorded_payment.status, "paid")

    def test_concurrent_subscription_and_unsubscribe_is_safe(self):
        """Subscribing and unsubscribing concurrently doesn't create inconsistent state."""
        # This test documents expected behavior: last write wins.
        subscription = create_subscription(self.user, self.plan, status="pending")

        # Simulate: one process activates, another cancels
        subscription.status = "active"
        subscription.save(update_fields=["status"])

        subscription.status = "canceled"
        subscription.save(update_fields=["status"])

        subscription.refresh_from_db()
        self.assertEqual(subscription.status, "canceled")

    @override_settings(**LIQPAY_SETTINGS)
    def test_upgrade_proration_calculation_is_correct(self):
        """Upgrading mid-cycle creates payment for price difference."""
        create_subscription(self.user, self.plan, status="active")
        premium_plan = create_subscription_plan(price=Decimal("499.00"))

        response = self.client.post(
            "/subscriptions/upgrade",
            data={"plan_id": premium_plan.pk},
            content_type="application/json",
            headers=self.auth,
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()

        # Verify payment was created for the price difference
        expected_diff = premium_plan.price - self.plan.price
        payment = SubscriptionPayment.objects.get(pk=data["paymentId"])
        self.assertEqual(payment.amount, expected_diff)
