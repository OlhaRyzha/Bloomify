# Testing

Bloomify uses Vitest for frontend tests, Testing Library for React component behavior, and MSW for API boundaries.

## Test Types

Prefer the smallest test that proves the behavior.

- Pure helpers: unit tests next to the helper, for example `src/i18n/routing.test.ts`.
- Feature behavior: tests near the owning feature, for example `src/features/cart/store/cart.store.test.ts`.
- Components: Testing Library tests focused on visible behavior, labels, roles, and user actions.
- API consumers: MSW handlers for network boundaries instead of mocking axios or fetch inside the component.

Avoid broad snapshot tests by default. They are noisy and rarely describe user-facing behavior.

## File Placement

Keep tests close to the code they protect unless the helper is intentionally shared across many features.

Use:

- `*.test.ts` for pure TypeScript behavior.
- `*.test.tsx` for React component behavior.
- `*.fixtures.ts` for static canonical data.
- `*.factory.ts` for test data builders with overrides.
- `*.mocks.ts` for test doubles such as `vi.fn()` or mocked modules.

Do not put factories or `vi.fn()` mocks inside fixture files.

## Fixtures

Fixtures are static, stable examples.

Good fixture content:

- canonical product objects
- stable ids
- locale codes
- valid and invalid form values
- immutable API responses used by several tests

Rules:

- Keep fixtures small.
- Use `as const` when literal values matter.
- Do not hide business logic in fixtures.
- Do not mutate shared fixtures in tests.

## Factories

Factories create variants.

Use factories when tests need the same object shape with small overrides.

```ts
export const createProductFixture = (
  overrides: Partial<ProductItem> = {}
): ProductItem => ({
  id: 'blue-harmony',
  name: 'Blue harmony',
  price: 1750,
  ...overrides,
});
```

Rules:

- Accept an `overrides` object.
- Start from clear defaults.
- Return plain objects.
- Do not call production mappers just to build expected values.

## Mocks

Mocks are for dependencies and side effects.

Use mocks for:

- router hooks
- browser APIs
- analytics calls
- callback spies

Prefer MSW for HTTP requests. Do not mock services directly when the behavior being tested is the API boundary.

## MSW

Shared MSW setup lives in `src/test/msw`.

- Add global always-on handlers only when they are safe for most tests.
- Prefer per-test handlers with `server.use(...)` for scenario-specific responses.
- Keep handlers close to the feature when they become domain-specific.
- Let unhandled requests fail tests; this catches hidden network coupling.

Example:

```ts
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';

server.use(
  http.get('/api/products', () => HttpResponse.json([{ id: 'rose' }]))
);
```

## React Tests

Use `renderWithProviders` from `src/test/render.tsx` when a component needs shared providers such as React Query or locale context.

Rules:

- Query by role, label, text, or accessible name.
- Use `userEvent` for interactions.
- Assert visible behavior, not implementation details.
- Avoid testing CSS class names unless the class is the actual contract.
- Keep one main behavior per test.

## Forms

Form tests should cover:

- initial values when they carry business meaning
- required validation messages
- invalid input validation
- successful submit payload
- disabled/loading states
- field-level and form-level errors

Validation schema tests can be pure unit tests. Full form tests should use Testing Library and user-level interactions.

## Zustand Stores

Store tests should cover actions and selectors directly.

Rules:

- Reset persisted/local store state between tests.
- Test selectors when they encode business behavior.
- Do not render a component just to test store action logic.

## Commands

E2E tests use `NEXT_PUBLIC_API_URL` to intercept backend API requests and
`PLAYWRIGHT_BASE_URL` to choose the frontend URL under test. Keep those values
environment-specific instead of hardcoding deployment URLs in specs.

From `frontend`:

```bash
npm run test
npm run test:all
npm run test:e2e
npm run test:unit
npm run test:unit:watch
npm run test:unit:ui
npm run test:coverage
```

Use `test:unit:ui` when you want the Vitest browser UI for an easier visual overview of test files, failed assertions, and reruns.

From the repository root:

```bash
make frontend-test
make frontend-test-all
make frontend-test-e2e
make frontend-test-unit
make frontend-test-watch
make frontend-test-ui
make frontend-test-coverage
```
