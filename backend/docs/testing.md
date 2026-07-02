# Backend Testing

Backend tests use Django's built-in `TestCase` and test client. Keep tests close to the owning app under `shop/tests`, grouped by behavior:

- `test_models.py` for model methods, defaults, and constraints.
- `test_serializers.py` for serializer validation and normalized data.
- `test_services.py` for pure domain/service functions.
- `test_selectors.py` for query behavior.
- `test_views.py` for API smoke tests and endpoint-level behavior.
- Feature-specific files such as `test_checkout_payments.py` when a workflow spans serializers, services, and views.

## Commands

Run backend checks from the repository root:

```bash
make lint
cd backend && uv run python manage.py test shop.tests
```

Run tests with coverage (matches what CI runs):

```bash
cd backend && uv run coverage run manage.py test shop.tests
cd backend && uv run coverage report
```

For model changes:

```bash
make makemigrations
cd backend && uv run python manage.py makemigrations --check --dry-run
```

Run a focused test file while developing:

```bash
cd backend && uv run python manage.py test shop.tests.test_checkout_payments
```

## Factories

Use `shop/tests/factories.py` for reusable model setup. Factories should:

- Return saved model instances.
- Define only valid defaults required by the model.
- Accept `**overrides` so each test can state only what matters.
- Avoid random data unless randomness is the behavior under test.
- Avoid hiding important relationships; if a test cares about an order item, create it visibly in that test or add a clearly named helper.

Prefer:

```python
product = create_product(price=Decimal("1750.00"))
order = create_order(payment_method="card", payment_provider="liqpay")
```

Avoid repeating raw `Model.objects.create(...)` blocks across many tests when the setup is not the behavior being tested.

## Fixtures

Prefer factory helpers over static fixture files. Static fixtures are acceptable only for stable reference data that is expensive or noisy to build in Python, such as a large language matrix.

Do not make shared fixtures mutate global state. Use `override_settings` for settings-dependent behavior, especially payment providers, auth secrets, callback URLs, and feature flags.

## API Tests

Use Django's test client for endpoint behavior:

- Send JSON with `content_type="application/json"`.
- Assert status codes first.
- Assert response body fields that belong to the API contract.
- Refresh models from the database before checking persisted side effects.
- Keep endpoint tests focused on one workflow; push pure calculations into service tests.

## Coverage

Coverage is measured with the `coverage` package and enforced in CI at **80% minimum** across the `shop` app.

Configuration lives in `backend/.coveragerc`. It excludes migrations and test files from measurement.

Run locally:

```bash
cd backend && uv run coverage run manage.py test shop.tests
cd backend && uv run coverage report
```

The CI step fails the build if coverage drops below 80%. When adding new services or views, add a corresponding test before coverage drops.

## Security Tests

Security-relevant behavior lives in `test_checkout_payments.py`. Tests in this group verify authorization boundaries, not just happy paths:

- **HMAC rejection** — `test_liqpay_callback_rejects_invalid_signature`: an unsigned or tampered callback payload must return 400 before touching the database.
- **Invalid token** — `test_liqpay_status_sync_rejects_invalid_token`: a well-formed but wrong token must return 403.
- **Cross-order token (IDOR)** — `test_payment_status_rejects_token_from_different_order`: a valid token from order A must not grant access to order B. The view compares `hash(token)` against the hash stored on the specific order in the URL, so a token is always scoped to one order.
- **Rate limiting** — `test_checkout_endpoint_is_rate_limited` and `test_payment_status_endpoint_is_rate_limited`: verify that `ScopedRateThrottle` returns 429 after the configured limit is hit.

When adding new endpoint authorization logic, add a matching rejection test. The pattern is: write the happy-path test first, then add a test that confirms the boundary cannot be crossed.

## Load Tests

Smoke load tests live in `backend/load_tests/` and use [k6](https://k6.io).

`liqpay-callback-smoke.js` runs in CI automatically — it starts a Django server, sends 20 requests with invalid signatures, and checks that all are rejected in under 200 ms.

`checkout-smoke.js` is not in CI — it requires a running backend with real product data. Run it manually before production deploys.

Install k6: `brew install k6` (macOS) or see [k6 docs](https://k6.io/docs/get-started/installation/).

```bash
# LiqPay callback HMAC rejection speed (no DB or running server required)
make load-test-callback

# Checkout endpoint (requires a running backend and a valid product ID)
PRODUCT_ID=<id> make load-test-checkout
```

`liqpay-callback-smoke.js` — sends requests with an invalid signature. The endpoint must reject them under 200 ms. No DB writes happen; this only tests HMAC check speed under load.

`checkout-smoke.js` — sends a full checkout payload. Requires `BASE_URL` pointing to a running backend and `PRODUCT_ID` of an existing product. Goal: p(95) < 500 ms, no 500 responses.

Both scripts use 1 VU and 20 iterations as a smoke baseline. Increase `vus` and `iterations` for actual stress testing.

## Payments

Payment tests must not call external providers. For LiqPay:

- Generate test `data` and `signature` locally.
- Use `override_settings` for sandbox keys and callback URLs.
- Verify both successful callback handling and invalid signature rejection.
- Store provider payload assertions at the boundary, not in unrelated model tests.

## Auth And Encoding

Shared encoding helpers live under `shop.security`. Payment integrations and future auth flows should reuse those helpers instead of copying base64 or JSON parsing logic into service modules.

When adding token or callback decoding tests, include invalid payload cases where the boundary can receive external input.

---

## Examples

### Model Tests (`test_models.py`)

Test model methods, properties, and constraints:

```python
from decimal import Decimal
from django.test import TestCase
from shop.models import Order, OrderItem
from shop.tests.factories import create_product, create_order

class OrderModelTest(TestCase):
    def test_total_price_returns_sum_of_items(self):
        order = create_order()
        product1 = create_product(price=Decimal("100.00"))
        product2 = create_product(price=Decimal("200.00"))
        OrderItem.objects.create(order=order, product=product1, quantity=2, unit_price=Decimal("100.00"), total=Decimal("200.00"))
        OrderItem.objects.create(order=order, product=product2, quantity=1, unit_price=Decimal("200.00"), total=Decimal("200.00"))
        
        self.assertEqual(order.total_price, Decimal("400.00"))

    def test_str_returns_order_number(self):
        order = create_order()
        self.assertEqual(str(order), f"Order №{order.pk}")
```

### Serializer Tests (`test_serializers.py`)

Test validation and normalized output:

```python
from decimal import Decimal
from django.test import TestCase
from rest_framework.exceptions import ValidationError
from shop.serializers import CheckoutSerializer
from shop.tests.factories import create_product

class CheckoutSerializerTest(TestCase):
    def test_serializer_validates_required_fields(self):
        serializer = CheckoutSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer_name', serializer.errors)
        self.assertIn('delivery_city', serializer.errors)

    def test_serializer_rejects_negative_quantity(self):
        data = {
            'customer_name': 'John Doe',
            'delivery_city': 'Kyiv',
            'delivery_address': 'St. 1',
            'items': [{'product_id': 1, 'quantity': -1}]
        }
        serializer = CheckoutSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('items', serializer.errors)

    def test_serializer_preserves_price_precision(self):
        product = create_product(price=Decimal("1234.56"))
        data = {
            'customer_name': 'John',
            'delivery_city': 'Kyiv',
            'delivery_address': 'St. 1',
            'items': [{'product_id': product.id, 'quantity': 1}]
        }
        serializer = CheckoutSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        # Verify that float doesn't creep in
        self.assertIsInstance(serializer.validated_data['items'][0]['unit_price'], Decimal)
```

### Service Tests (`test_services.py`)

Test business logic in isolation:

```python
from decimal import Decimal
from django.test import TestCase
from shop.models import Order
from shop.services.orders import calculate_order_total, apply_promo_code
from shop.tests.factories import create_product, create_promo_code

class OrderServiceTest(TestCase):
    def test_calculate_order_total_includes_delivery(self):
        items_subtotal = Decimal("1000.00")
        delivery_cost = Decimal("150.00")
        
        total = calculate_order_total(
            subtotal=items_subtotal,
            delivery_cost=delivery_cost,
            discount=Decimal("0.00")
        )
        
        self.assertEqual(total, Decimal("1150.00"))

    def test_apply_promo_code_calculates_correct_discount(self):
        promo = create_promo_code(discount_percent=10)
        subtotal = Decimal("1000.00")
        
        discount = apply_promo_code(promo, subtotal)
        
        self.assertEqual(discount, Decimal("100.00"))

    def test_promo_code_with_min_amount_validates(self):
        promo = create_promo_code(discount_percent=10, min_order_amount=Decimal("500.00"))
        
        # Below minimum
        with self.assertRaises(ValueError):
            apply_promo_code(promo, Decimal("300.00"))
        
        # Above minimum — OK
        discount = apply_promo_code(promo, Decimal("600.00"))
        self.assertEqual(discount, Decimal("60.00"))
```

### API/View Tests (`test_views.py`)

Test endpoint behavior and contracts:

```python
from decimal import Decimal
from django.test import TestCase
from shop.tests.factories import create_product, build_checkout_payload

class CheckoutAPITest(TestCase):
    def setUp(self):
        self.product = create_product(price=Decimal("1000.00"))

    def test_checkout_creates_order_and_returns_liqpay_link(self):
        payload = build_checkout_payload(product_id=self.product.id, quantity=1)
        
        response = self.client.post(
            "/orders/checkout",
            data=payload,
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 201)
        self.assertIn('checkout_url', response.json())
        self.assertIn('order_id', response.json())

    def test_checkout_validates_product_exists(self):
        payload = build_checkout_payload(product_id=99999, quantity=1)
        
        response = self.client.post(
            "/orders/checkout",
            data=payload,
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('items', response.json())

    def test_checkout_rejects_zero_quantity(self):
        payload = build_checkout_payload(product_id=self.product.id, quantity=0)
        
        response = self.client.post(
            "/orders/checkout",
            data=payload,
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 400)
```

### Transactional Service Tests

For services that use `transaction.atomic()`:

```python
from decimal import Decimal
from django.test import TestCase
from shop.services.payments import process_payment_callback
from shop.tests.factories import create_liqpay_order

class PaymentCallbackTest(TestCase):
    def test_payment_callback_marks_order_paid_atomically(self):
        order = create_liqpay_order()
        self.assertEqual(order.payment_status, "pending")
        
        # Process callback
        process_payment_callback(
            order_id=order.liqpay_order_id,
            status="success",
            payment_id="liq_123"
        )
        
        # Refresh and verify
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "paid")
        
        # Verify side effects (notification sent, etc)
        # This test ensures all-or-nothing behavior

    def test_payment_callback_rolls_back_on_error(self):
        order = create_liqpay_order()
        
        with self.assertRaises(ValueError):
            # Intentionally invalid data
            process_payment_callback(
                order_id=order.liqpay_order_id,
                status="invalid_status",
                payment_id="liq_123"
            )
        
        # Order should still be pending
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "pending")
```
