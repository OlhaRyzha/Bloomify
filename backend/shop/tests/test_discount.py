from decimal import Decimal

from django.test import TestCase

from shop.models.product import Product
from shop.models.promo_code import PromoCode
from shop.selectors.products import (
    SALE_TAG_MARKER,
    filter_products_queryset,
    get_active_product_tags,
    get_active_products_queryset,
)
from shop.serializers.product import ProductSerializer
from shop.tests.factories import (
    build_checkout_payload,
    create_product,
)

# ---------------------------------------------------------------------------
# ProductSerializer — discountedPrice / isSale
# ---------------------------------------------------------------------------


class ProductDiscountSerializerTest(TestCase):
    def test_discounted_price_is_none_when_no_discount(self):
        product = create_product(price="200.00")

        data = ProductSerializer(product).data

        self.assertIsNone(data["discountedPrice"])
        self.assertFalse(data["isSale"])

    def test_discounted_price_computed_from_price_minus_discount(self):
        product = create_product(price="200.00", discount=Decimal("50.00"))

        data = ProductSerializer(product).data

        self.assertEqual(data["discountedPrice"], "150.00")
        self.assertTrue(data["isSale"])

    def test_discounted_price_rounded_to_two_decimal_places(self):
        product = create_product(price="199.99", discount=Decimal("0.01"))

        data = ProductSerializer(product).data

        self.assertEqual(data["discountedPrice"], "199.98")

    def test_is_sale_false_when_discount_is_null(self):
        product = create_product(price="100.00", discount=None)

        data = ProductSerializer(product).data

        self.assertFalse(data["isSale"])


# ---------------------------------------------------------------------------
# Selectors — SALE_TAG_MARKER
# ---------------------------------------------------------------------------


def _make_active_product_with_tag(name: str, tag: str, discount=None) -> Product:
    product = create_product(discount=discount)
    product.set_current_language("uk")
    product.name = name
    product.tag = tag
    product.save()
    return product


class SaleTagSelectorTest(TestCase):
    def test_sale_marker_not_in_tags_when_no_discounted_products(self):
        _make_active_product_with_tag("Троянди", "Класика", discount=None)

        tags = get_active_product_tags(language_code="uk")

        self.assertNotIn(SALE_TAG_MARKER, tags)

    def test_sale_marker_appended_when_any_product_has_discount(self):
        _make_active_product_with_tag("Троянди", "Класика", discount=None)
        _make_active_product_with_tag("Акційні", "Акція", discount=Decimal("50.00"))

        tags = get_active_product_tags(language_code="uk")

        self.assertIn(SALE_TAG_MARKER, tags)

    def test_sale_marker_is_last_in_list(self):
        _make_active_product_with_tag("Троянди", "Класика", discount=Decimal("10.00"))

        tags = get_active_product_tags(language_code="uk")

        self.assertEqual(tags[-1], SALE_TAG_MARKER)

    def test_regular_tags_still_present_alongside_sale_marker(self):
        _make_active_product_with_tag("Троянди", "Класика", discount=Decimal("10.00"))

        tags = get_active_product_tags(language_code="uk")

        self.assertIn("Класика", tags)
        self.assertIn(SALE_TAG_MARKER, tags)

    def test_filter_by_sale_marker_returns_only_discounted_products(self):
        discounted = create_product(discount=Decimal("20.00"))
        regular = create_product(discount=None)

        qs = filter_products_queryset(
            get_active_products_queryset(),
            tag=SALE_TAG_MARKER,
        )

        self.assertIn(discounted, qs)
        self.assertNotIn(regular, qs)

    def test_filter_by_sale_marker_returns_empty_when_no_discounts(self):
        create_product(discount=None)

        qs = filter_products_queryset(
            get_active_products_queryset(),
            tag=SALE_TAG_MARKER,
        )

        self.assertEqual(qs.count(), 0)


# ---------------------------------------------------------------------------
# Product filters API — __sale__ in response
# ---------------------------------------------------------------------------


class ProductFiltersApiSaleTest(TestCase):
    def test_sale_marker_returned_in_filters_when_discounted_product_exists(self):
        product = create_product(discount=Decimal("30.00"))
        product.set_current_language("uk")
        product.name = "Акційний"
        product.tag = "Акція"
        product.save()

        response = self.client.get("/products/filters", {"lang": "uk"})

        self.assertEqual(response.status_code, 200)
        self.assertIn(SALE_TAG_MARKER, response.json()["tags"])

    def test_sale_marker_absent_when_no_discounted_products(self):
        product = create_product(discount=None)
        product.set_current_language("uk")
        product.name = "Звичайний"
        product.tag = "Класика"
        product.save()

        response = self.client.get("/products/filters", {"lang": "uk"})

        self.assertEqual(response.status_code, 200)
        self.assertNotIn(SALE_TAG_MARKER, response.json()["tags"])

    def test_filtering_by_sale_marker_returns_only_discounted(self):
        discounted = create_product(discount=Decimal("10.00"))
        discounted.set_current_language("uk")
        discounted.name = "Акційний"
        discounted.tag = "Акція"
        discounted.save()

        regular = create_product(discount=None)
        regular.set_current_language("uk")
        regular.name = "Звичайний"
        regular.tag = "Класика"
        regular.save()

        response = self.client.get(
            "/products",
            {"lang": "uk", "page": "1", "pageSize": "10", "tag": SALE_TAG_MARKER},
        )

        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.json()["items"]]
        self.assertIn(str(discounted.pk), ids)
        self.assertNotIn(str(regular.pk), ids)


# ---------------------------------------------------------------------------
# Checkout with promo code
# ---------------------------------------------------------------------------


def _make_promo(
    *,
    code: str,
    discount_type: str = "fixed",
    discount_value: str = "100.00",
    is_active: bool = True,
) -> PromoCode:
    return PromoCode.objects.create(
        code=code,
        discount_type=discount_type,
        discount_value=Decimal(discount_value),
        is_active=is_active,
    )


class CheckoutWithPromoCodeTest(TestCase):
    def _checkout(self, product_id: int, promo_code: str | None = None):
        payload = build_checkout_payload(
            product_id=product_id,
            payment_method="cash_on_delivery",
        )
        if promo_code:
            payload["promoCode"] = promo_code
        response = self.client.post(
            "/orders/checkout",
            data=payload,
            content_type="application/json",
        )
        return response

    def test_checkout_without_promo_sets_zero_discount(self):
        product = create_product(price="500.00")

        response = self._checkout(product.pk)

        self.assertEqual(response.status_code, 201)
        from shop.models.order import Order

        order = Order.objects.get(pk=response.json()["orderId"])
        self.assertEqual(order.discount, Decimal("0.00"))
        self.assertIsNone(order.promo_code)

    def test_checkout_with_valid_fixed_promo_applies_discount(self):
        product = create_product(price="500.00")
        _make_promo(code="SAVE100")

        response = self._checkout(product.pk, promo_code="SAVE100")

        self.assertEqual(response.status_code, 201)
        from shop.models.order import Order

        order = Order.objects.get(pk=response.json()["orderId"])
        self.assertEqual(order.discount, Decimal("100.00"))
        self.assertIsNotNone(order.promo_code)
        assert order.promo_code is not None
        self.assertEqual(order.promo_code.code, "SAVE100")
        self.assertEqual(
            order.total, order.subtotal + order.delivery_cost - Decimal("100.00")
        )

    def test_checkout_with_valid_percentage_promo_applies_discount(self):
        product = create_product(price="200.00")
        _make_promo(code="PCT20", discount_type="percentage", discount_value="20.00")

        response = self._checkout(product.pk, promo_code="PCT20")

        self.assertEqual(response.status_code, 201)
        from shop.models.order import Order

        order = Order.objects.get(pk=response.json()["orderId"])
        self.assertEqual(order.discount, Decimal("40.00"))

    def test_checkout_with_valid_promo_increments_used_count(self):
        product = create_product(price="300.00")
        promo = _make_promo(code="COUNTER1")
        initial_count = promo.used_count

        self._checkout(product.pk, promo_code="COUNTER1")

        promo.refresh_from_db()
        self.assertEqual(promo.used_count, initial_count + 1)

    def test_checkout_with_unknown_promo_ignores_it_gracefully(self):
        product = create_product(price="300.00")

        response = self._checkout(product.pk, promo_code="NOTEXIST")

        self.assertEqual(response.status_code, 201)
        from shop.models.order import Order

        order = Order.objects.get(pk=response.json()["orderId"])
        self.assertEqual(order.discount, Decimal("0.00"))
        self.assertIsNone(order.promo_code)

    def test_checkout_with_inactive_promo_ignores_it_gracefully(self):
        product = create_product(price="300.00")
        _make_promo(code="INACTIVE", is_active=False)

        response = self._checkout(product.pk, promo_code="INACTIVE")

        self.assertEqual(response.status_code, 201)
        from shop.models.order import Order

        order = Order.objects.get(pk=response.json()["orderId"])
        self.assertEqual(order.discount, Decimal("0.00"))

    def test_checkout_promo_does_not_increment_count_when_invalid(self):
        product = create_product(price="300.00")
        promo = _make_promo(code="NOCOUNT1", is_active=False)

        self._checkout(product.pk, promo_code="NOCOUNT1")

        promo.refresh_from_db()
        self.assertEqual(promo.used_count, 0)

    def test_checkout_total_cannot_go_below_zero_with_large_discount(self):
        product = create_product(price="50.00")
        _make_promo(code="HUGE999", discount_type="fixed", discount_value="9999.00")

        response = self._checkout(product.pk, promo_code="HUGE999")

        self.assertEqual(response.status_code, 201)
        from shop.models.order import Order

        order = Order.objects.get(pk=response.json()["orderId"])
        self.assertGreaterEqual(order.total, Decimal("0.00"))
