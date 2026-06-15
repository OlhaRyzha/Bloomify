from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from shop.models.promo_code import PROMO_CODE_LENGTH, PromoCode, generate_promo_code

# ---------------------------------------------------------------------------
# generate_promo_code
# ---------------------------------------------------------------------------


class GeneratePromoCodeTest(TestCase):
    def test_returns_string_of_correct_length(self):
        code = generate_promo_code()

        self.assertEqual(len(code), PROMO_CODE_LENGTH)

    def test_uses_only_allowed_characters(self):
        excluded = set("IO01")
        for _ in range(20):
            code = generate_promo_code()
            self.assertTrue(code.isupper() or code.isdigit() or code.isalnum())
            self.assertTrue(
                excluded.isdisjoint(set(code)),
                msg=f"Code '{code}' contains excluded char",
            )

    def test_codes_are_not_all_identical(self):
        codes = {generate_promo_code() for _ in range(10)}
        self.assertGreater(len(codes), 1)


# ---------------------------------------------------------------------------
# PromoCode.is_valid
# ---------------------------------------------------------------------------


def make_promo(
    *,
    code: str = "TESTCODE",
    discount_type: str = "fixed",
    discount_value: str = "50.00",
    is_active: bool = True,
    max_uses: int | None = None,
    used_count: int = 0,
    valid_from=None,
    valid_until=None,
) -> PromoCode:
    promo = PromoCode.objects.create(
        code=code,
        discount_type=discount_type,
        discount_value=Decimal(discount_value),
        is_active=is_active,
        max_uses=max_uses,
        valid_from=valid_from,
        valid_until=valid_until,
    )
    if used_count:
        PromoCode.objects.filter(pk=promo.pk).update(used_count=used_count)
        promo.refresh_from_db()
    return promo


class PromoCodeIsValidTest(TestCase):
    def test_active_code_without_limits_is_valid(self):
        promo = make_promo()
        self.assertTrue(promo.is_valid())

    def test_inactive_code_is_not_valid(self):
        promo = make_promo(is_active=False)
        self.assertFalse(promo.is_valid())

    def test_exhausted_max_uses_is_not_valid(self):
        promo = make_promo(max_uses=3, used_count=3)
        self.assertFalse(promo.is_valid())

    def test_below_max_uses_is_valid(self):
        promo = make_promo(max_uses=3, used_count=2)
        self.assertTrue(promo.is_valid())

    def test_not_yet_started_is_not_valid(self):
        promo = make_promo(valid_from=timezone.now() + timedelta(hours=1))
        self.assertFalse(promo.is_valid())

    def test_started_in_past_is_valid(self):
        promo = make_promo(valid_from=timezone.now() - timedelta(hours=1))
        self.assertTrue(promo.is_valid())

    def test_expired_is_not_valid(self):
        promo = make_promo(valid_until=timezone.now() - timedelta(seconds=1))
        self.assertFalse(promo.is_valid())

    def test_expires_in_future_is_valid(self):
        promo = make_promo(valid_until=timezone.now() + timedelta(days=1))
        self.assertTrue(promo.is_valid())


# ---------------------------------------------------------------------------
# PromoCode.calculate_discount
# ---------------------------------------------------------------------------


class PromoCodeCalculateDiscountTest(TestCase):
    def test_fixed_discount_returns_exact_amount(self):
        promo = make_promo(discount_type="fixed", discount_value="100.00")

        result = promo.calculate_discount(Decimal("500.00"))

        self.assertEqual(result, Decimal("100.00"))

    def test_fixed_discount_capped_at_subtotal(self):
        promo = make_promo(discount_type="fixed", discount_value="600.00")

        result = promo.calculate_discount(Decimal("500.00"))

        self.assertEqual(result, Decimal("500.00"))

    def test_percentage_discount_calculates_correctly(self):
        promo = make_promo(discount_type="percentage", discount_value="10.00")

        result = promo.calculate_discount(Decimal("200.00"))

        self.assertEqual(result, Decimal("20.00"))

    def test_percentage_discount_rounds_to_two_decimal_places(self):
        promo = make_promo(discount_type="percentage", discount_value="15.00")

        result = promo.calculate_discount(Decimal("333.00"))

        self.assertEqual(result, Decimal("49.95"))

    def test_percentage_100_caps_at_subtotal(self):
        promo = make_promo(discount_type="percentage", discount_value="100.00")

        result = promo.calculate_discount(Decimal("250.00"))

        self.assertEqual(result, Decimal("250.00"))


# ---------------------------------------------------------------------------
# ValidatePromoCodeView  POST /orders/promo/validate
# ---------------------------------------------------------------------------


class ValidatePromoCodeViewTest(TestCase):
    URL = "/orders/promo/validate"

    def test_valid_fixed_code_returns_discount(self):
        make_promo(code="FIXED50", discount_type="fixed", discount_value="50.00")

        response = self.client.post(
            self.URL,
            data={"code": "FIXED50", "subtotal": "500.00"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["code"], "FIXED50")
        self.assertEqual(body["discount"], "50.00")
        self.assertEqual(body["discountType"], "fixed")

    def test_valid_percentage_code_returns_computed_discount(self):
        make_promo(code="PCT10", discount_type="percentage", discount_value="10.00")

        response = self.client.post(
            self.URL,
            data={"code": "PCT10", "subtotal": "300.00"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["discount"], "30.00")

    def test_code_lookup_is_case_insensitive(self):
        make_promo(code="UPPER8", discount_type="fixed", discount_value="20.00")

        response = self.client.post(
            self.URL,
            data={"code": "upper8", "subtotal": "100.00"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)

    def test_unknown_code_returns_404(self):
        response = self.client.post(
            self.URL,
            data={"code": "NOEXIST", "subtotal": "100.00"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)

    def test_inactive_code_returns_422(self):
        make_promo(code="INACTIVE", is_active=False)

        response = self.client.post(
            self.URL,
            data={"code": "INACTIVE", "subtotal": "100.00"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 422)

    def test_expired_code_returns_422(self):
        make_promo(
            code="EXPIRED1",
            valid_until=timezone.now() - timedelta(seconds=1),
        )

        response = self.client.post(
            self.URL,
            data={"code": "EXPIRED1", "subtotal": "100.00"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 422)

    def test_missing_code_returns_400(self):
        response = self.client.post(
            self.URL,
            data={"subtotal": "100.00"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_discount_capped_when_exceeds_subtotal(self):
        make_promo(code="BIG100", discount_type="fixed", discount_value="9999.00")

        response = self.client.post(
            self.URL,
            data={"code": "BIG100", "subtotal": "200.00"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["discount"], "200.00")
