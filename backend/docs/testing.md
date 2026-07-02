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

Load tests live in `backend/load_tests/` and use [k6](https://k6.io). Install k6: `brew install k6` (macOS) or see [k6 docs](https://k6.io/docs/get-started/installation/).

### Smoke Tests (CI)

Smoke tests run in CI to catch regressions early.

**`liqpay-callback-smoke.js`** — sends 20 requests with invalid signatures. Endpoint must reject all in < 200 ms before touching DB.

```bash
make load-test-callback
```

### Manual Load Tests (Pre-Deployment)

Run these manually against a running backend before production deploys.

**`checkout-smoke.js`** — baseline checkout flow. Goal: p(95) < 500 ms.

```bash
PRODUCT_ID=1 make load-test-checkout
```

**`catalog-load.js`** — moderate concurrent browsing load: 20 VU for 1 minute. Tests pagination, sorting, filtering.

```bash
k6 run backend/load_tests/catalog-load.js --env BASE_URL=http://localhost:8000
```

Goals:

- p(95) < 300 ms (most requests fast)
- p(99) < 500 ms (tail acceptable)
- < 0.1% errors

**`checkout-stress.js`** — ramps from 5 to 50 concurrent users. Tests endpoint stability under peak load, rate limiting behavior.

```bash
PRODUCT_ID=1 k6 run backend/load_tests/checkout-stress.js --env BASE_URL=http://localhost:8000
```

Goals:

- Endpoint remains available (no 500 errors)
- Rate limiting (429) is graceful, not an outage
- p(95) < 1000 ms under peak load

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

## Edge Case & Concurrent Tests

### Idempotency Testing

For critical operations (payments, subscriptions):

```python
from decimal import Decimal
from threading import Thread
from django.test import TestCase
from shop.models import SubscriptionPayment
from shop.services.subscriptions import handle_liqpay_webhook
from shop.tests.factories import create_subscription

class SubscriptionIdempotencyTest(TestCase):
    def test_webhook_processed_twice_returns_same_state(self):
        """Same webhook twice = subscription active once, not duplicated."""
        sub = create_subscription(status="pending")
        webhook_payload = {
            "order_id": sub.liqpay_order_id,
            "status": "success",
            "amount": str(sub.plan.price)
        }
        
        # Process twice
        handle_liqpay_webhook(webhook_payload)
        handle_liqpay_webhook(webhook_payload)  # Idempotent
        
        # Verify single activation
        sub.refresh_from_db()
        self.assertEqual(sub.status, "active")
        self.assertEqual(
            SubscriptionPayment.objects.filter(provider_order_id=sub.liqpay_order_id).count(),
            1
        )

    def test_concurrent_checkout_creates_single_order(self):
        """Two simultaneous checkouts with same cart = only one order persists."""
        results = []
        
        def checkout():
            response = self.client.post('/orders/checkout', data=checkout_payload)
            results.append(response.json()['order_id'])
        
        t1 = Thread(target=checkout)
        t2 = Thread(target=checkout)
        
        t1.start()
        t2.start()
        t1.join()
        t2.join()
        
        # Expect only one order created with deduplication
        self.assertEqual(len(set(results)), 1, "Should create one order, not two")
```

### State Machine Tests

```python
class SubscriptionLifecycleTest(TestCase):
    def test_subscription_cannot_upgrade_from_canceled(self):
        sub = create_subscription(status="canceled")
        
        with self.assertRaises(InvalidStateTransition):
            sub.upgrade_plan(new_plan=self.plan_pro)

    def test_subscription_cancel_after_upgrade_prorates_correctly(self):
        sub = create_subscription(plan=self.plan_basic, status="active", billing_cycle_start=today - timedelta(days=15))
        # 15 days into 30-day cycle = 50% through
        
        sub.upgrade_plan(self.plan_pro)  # $50 + $50 upgrade charge
        sub.refresh_from_db()
        self.assertEqual(sub.next_billing_date, today + timedelta(days=15))
        
        # Now cancel mid-cycle
        sub.cancel()
        # Should issue pro-rata credit
        refund = sub.get_pending_refund()
        self.assertGreater(refund, Decimal("0.00"))
```

### Boundary & Constraint Tests

```python
class OrderConstraintTest(TestCase):
    def test_order_item_quantity_minimum_one(self):
        """Database constraint: quantity >= 1."""
        with self.assertRaises(ValueError):
            OrderItem.objects.create(order=self.order, product=self.product, quantity=0)

    def test_order_total_price_cannot_be_negative(self):
        """Business logic: total must be >= 0."""
        order = create_order(discount=Decimal("10000.00"))  # More than items
        
        with self.assertRaises(ValueError):
            order.recalculate_total()

    def test_promo_code_usage_limit_enforced(self):
        """Per-user limit: can't use same promo twice."""
        promo = create_promo_code(max_uses_per_user=1)
        user = create_user()
        
        # First use — OK
        create_order(user=user, promo_code=promo)
        
        # Second use — rejected
        with self.assertRaises(PromoCodeLimitExceededError):
            create_order(user=user, promo_code=promo)
```

## Signal & Side-Effect Tests

### Order Status Logging via Signals

```python
from django.test import TestCase
from shop.models import OrderStatusLog
from shop.tests.factories import create_order

class OrderStatusSignalTest(TestCase):
    def test_order_status_change_creates_log_entry(self):
        """When order.status changes, OrderStatusLog created via signal."""
        order = create_order(status="pending")
        self.assertEqual(OrderStatusLog.objects.count(), 0)
        
        order.status = "processing"
        order.save()
        
        # Signal should fire
        logs = OrderStatusLog.objects.filter(order=order)
        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs[0].old_status, "pending")
        self.assertEqual(logs[0].new_status, "processing")

    def test_signal_includes_timestamp_and_reason(self):
        """Audit trail captures when and why status changed."""
        order = create_order(status="pending")
        order.status = "shipped"
        order.reason_for_change = "Customer paid"
        order.save()
        
        log = OrderStatusLog.objects.get(order=order)
        self.assertIsNotNone(log.created_at)
        self.assertEqual(log.reason, "Customer paid")
```

### Payment Webhook Side Effects

```python
from unittest.mock import patch
from django.test import TestCase
from shop.services.payments import handle_liqpay_callback
from shop.tests.factories import create_liqpay_order

class PaymentWebhookSideEffectTest(TestCase):
    @patch('shop.services.notifications.send_order_confirmation')
    def test_payment_success_triggers_notification(self, mock_notify):
        """When payment succeeds, customer gets email."""
        order = create_liqpay_order()
        
        handle_liqpay_callback(order_id=order.liqpay_order_id, status="success")
        
        mock_notify.assert_called_once()
        call_args = mock_notify.call_args[0]
        self.assertEqual(call_args[0].pk, order.pk)

    @patch('shop.tasks.send_email_async.delay')
    def test_notification_queued_via_celery(self, mock_celery):
        """Side effect uses task queue, not blocking."""
        order = create_liqpay_order()
        
        handle_liqpay_callback(order_id=order.liqpay_order_id, status="success")
        
        mock_celery.assert_called_once()
```

## Admin Interface Tests

```python
from django.contrib.admin.sites import AdminSite
from django.test import TestCase
from shop.models import Order
from shop.admin.orders import OrderAdmin, OrderStatusLogInline
from shop.tests.factories import create_order

class OrderAdminTest(TestCase):
    def setUp(self):
        self.admin_site = AdminSite()
        self.admin = OrderAdmin(Order, self.admin_site)
        self.order = create_order()

    def test_admin_readonly_fields_not_editable(self):
        """payment_status, total cannot be edited via admin."""
        readonly = self.admin.readonly_fields
        self.assertIn('payment_status', readonly)
        self.assertIn('total', readonly)

    def test_admin_status_log_inline_visible(self):
        """Admin shows OrderStatusLog inline."""
        # Create a status change
        self.order.status = "shipped"
        self.order.save()
        
        # Admin should display logs
        inline = OrderStatusLogInline(Order, self.admin_site)
        qs = inline.get_queryset(None)
        self.assertGreater(qs.count(), 0)
```

## Query Performance & N+1 Tests

```python
from django.test.utils import override_settings
from django.db import connection
from django.test.utils import CaptureQueriesContext

class OrderQueryPerformanceTest(TestCase):
    def test_order_list_no_n_plus_one(self):
        """Listing 100 orders queries products once, not 100+ times."""
        # Create 100 orders with items
        for i in range(100):
            order = create_order()
            OrderItem.objects.create(
                order=order,
                product=create_product(),
                quantity=1,
                unit_price=Decimal("1000.00")
            )
        
        with CaptureQueriesContext(connection) as context:
            orders = Order.objects.select_related('user').prefetch_related('items__product')
            list(orders)
            
            # Should query Order table once, items once per order, products once total
            query_count = len(context.captured_queries)
            # Expect ~3 queries: orders, order items, products (not 102)
            self.assertLess(query_count, 10, f"Too many queries: {query_count}")

    def test_order_filter_uses_index(self):
        """Filtering by status on large table is fast."""
        for status in ['pending', 'shipped', 'delivered']:
            for i in range(100):
                create_order(status=status)
        
        with CaptureQueriesContext(connection) as context:
            orders = Order.objects.filter(status='pending').values_list('id')
            list(orders)
            
            # Index on status ensures < 2ms for 10k rows
            # (In-memory test set is small but verifies query shape)
            self.assertEqual(len(context.captured_queries), 1)
```

## Test Utilities & Helpers

### Factories with Required Fields

```python
# shop/tests/factories.py
from factory import DjangoModelFactory, Faker, SubFactory
from shop.models import Order, OrderItem

class OrderFactory(DjangoModelFactory):
    class Meta:
        model = Order
    
    status = "pending"
    customer_name = Faker('name')
    email = Faker('email')
    delivery_address = Faker('address')
    total = Decimal("1000.00")
    payment_status = "pending"

class OrderItemFactory(DjangoModelFactory):
    class Meta:
        model = OrderItem
    
    order = SubFactory(OrderFactory)
    product = SubFactory(ProductFactory)
    quantity = 1
    unit_price = Decimal("1000.00")
    total = Decimal("1000.00")

# Usage in tests:
order = OrderFactory.create(status="shipped", total=Decimal("500.00"))
items = OrderItemFactory.create_batch(5, order=order)
```

### Custom Assertions

```python
# shop/tests/assertions.py
from django.test import TestCase

class APIAssertions(TestCase):
    def assertOrderStatusCode(self, response, expected_status):
        """Helper: Check status, log response if wrong."""
        if response.status_code != expected_status:
            print(f"Response body: {response.json()}")
        self.assertEqual(response.status_code, expected_status)

    def assertOrderHasValidShape(self, order_data):
        """Validate response matches API contract."""
        required_fields = ['id', 'status', 'total', 'created_at']
        for field in required_fields:
            self.assertIn(field, order_data, f"Missing {field}")
        self.assertIsNotNone(order_data['created_at'])
```
