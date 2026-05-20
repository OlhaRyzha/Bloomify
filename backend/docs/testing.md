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

## Payments

Payment tests must not call external providers. For LiqPay:

- Generate test `data` and `signature` locally.
- Use `override_settings` for sandbox keys and callback URLs.
- Verify both successful callback handling and invalid signature rejection.
- Store provider payload assertions at the boundary, not in unrelated model tests.

## Auth And Encoding

Shared encoding helpers live under `shop.security`. Payment integrations and future auth flows should reuse those helpers instead of copying base64 or JSON parsing logic into service modules.

When adding token or callback decoding tests, include invalid payload cases where the boundary can receive external input.
