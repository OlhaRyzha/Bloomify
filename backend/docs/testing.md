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
