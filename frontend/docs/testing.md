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
  price: '1750',
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

The server is configured with `onUnhandledRequest: 'error'` in `src/test/setup.ts`. Any test that triggers a network request without a matching handler will fail. This is intentional — it surfaces hidden network coupling early.

### Global baseline handlers

`src/test/msw/handlers.ts` provides always-on handlers for endpoints that most tests implicitly depend on:

| Handler | Returns |
| --- | --- |
| `GET /products` | `createProductListResponse()` — one default product |
| `GET /products/filters` | `createProductFiltersResponse()` — one default tag |

These handlers use the same factory functions as unit tests, so the shape is always valid and type-safe.

Add a handler to this file only when it is safe for **all** tests — no business-specific state. For scenario-specific responses use `server.use(...)` inside the individual test:

```ts
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';

server.use(
  http.get(apiUrl('products'), () =>
    HttpResponse.json(createProductListResponse({ total: 0, items: [] }))
  )
);
```

Per-test handlers are reset automatically after each test via `server.resetHandlers()` in the setup.

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

E2E tests use `PLAYWRIGHT_BASE_URL` for the frontend URL and
`PLAYWRIGHT_API_URL` for the mock API that backs server and client requests.
The Playwright config passes that API URL to Next.js as `NEXT_PUBLIC_API_URL`
for the test run. Keep those values environment-specific instead of hardcoding
deployment URLs in specs.

The Playwright web server disables Sentry browser/tunnel env for test runs.
This keeps e2e output focused on app behavior and avoids proxy noise from
third-party monitoring endpoints. Do not rely on Sentry side effects in e2e
tests; assert user-visible error states instead.

## E2E Data Source Policy

Default Playwright smoke, a11y, and visual tests use the local mock API in
`e2e/mock-api/server.mjs`. Keep visual snapshots on deterministic mock data.
Do not point visual regression tests at a live Django database or admin-managed
media by default: changed seed data, uploaded images, translations, or admin
edits would create noisy screenshot diffs unrelated to frontend regressions.

Use the backend and Docker Compose for integration checks where the goal is to
verify the real API contract. Those checks should have their own command and
seeded test data. They should not replace the deterministic visual baseline.

From `frontend`:

```bash
npm run test
npm run test:all
npm run test:e2e
npm run test:e2e:a11y
npm run test:e2e:visual
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
make frontend-test-e2e-a11y
make frontend-test-e2e-visual
make frontend-test-unit
make frontend-test-watch
make frontend-test-ui
make frontend-test-coverage
```

Use `make frontend-test-e2e-a11y` after changing page shells, shared layout,
forms, navigation, color tokens, skeletons, empty states, or error states. The
axe suite runs against critical page states and should keep `color-contrast`
enabled; fix tokens/components instead of suppressing contrast failures.

Use `make frontend-test-e2e-visual` after changing responsive layout, shared
spacing, page shells, header/footer composition, catalog cards, checkout
layout, or global visual tokens.

## Visual Regression Snapshot Approval

Visual snapshots live in `e2e/visual-responsive.spec.ts-snapshots/`.

### When to Update Snapshots

**Update snapshots when:**

- You intentionally changed colors, spacing, fonts, or layout
- You updated Tailwind tokens
- You refactored a page shell or component layout
- Snapshot diff shows exactly what you expect

**Do NOT update when:**

- Snapshot shows unintended diff (e.g., truncated text, misaligned elements)
- Image quality or rendering changed due to dependency upgrade
- Page layout broke due to a bug (fix the bug first)

### Approval Workflow

1. **Run visual tests locally to see diffs:**

   ```bash
   npm run test:e2e:visual
   ```

   Playwright will show `Expected` (baseline) vs `Actual` (current).

2. **Review the diff:**

   - Open `test-results/` or `playwright-report/` in browser
   - Compare side-by-side
   - Is this change intentional and correct?

3. **If diff is correct, update snapshot:**

   ```bash
   npm run test:e2e:visual -- --update-snapshots
   ```

   Or let CI auto-update on PR (see below).

4. **Commit updated snapshots:**

   ```bash
   git add e2e/visual-responsive.spec.ts-snapshots/
   git commit -m "chore: update visual snapshots for [reason]"
   ```

### CI Visual Regression Workflow

In `.github/workflows/frontend-ci.yml`, the `e2e` job:

1. Runs visual tests (`--update-snapshots` disabled)
2. If tests fail due to diff (not crash):
   - Auto-updates snapshots
   - Commits and pushes to branch
   - Posts warning: "Visual snapshots were updated — re-run to verify"
3. You re-run the job to verify new baseline

**Why this process?**

- Catches unintended visual regressions early
- Prevents shipping broken layouts
- Requires human review of all visual changes
- Snapshots are kept in git for code review

### Snapshot Review Checklist

When reviewing a PR with updated snapshots:

- [ ] Diffs are intentional (color change, spacing update, etc.)
- [ ] No truncated text or overflow
- [ ] No misaligned elements
- [ ] Font sizes and weights correct
- [ ] Responsive layout still works
- [ ] Dark mode (if applicable) looks consistent

### Common Issues

#### Image looks slightly different (fuzzy, aliased)

Cause: Font rendering, sub-pixel anti-aliasing, or Playwright version change.

Fix: If diff is minor and unrelated to your change, update snapshot. Otherwise, investigate why rendering changed.

#### Snapshot baseline was wrong

You can rebuild the baseline:

```bash
# Delete old snapshots (careful!)
rm e2e/visual-responsive.spec.ts-snapshots/*.png

# Regenerate from current code
npm run test:e2e:visual -- --update-snapshots

# Review, then commit
```

#### CI auto-updated but you don't like the diff

Revert the snapshot commit and fix the code instead:

```bash
git revert <snapshot-commit>
# Then fix the bug/layout issue
npm run test:e2e:visual  # Should pass now
```
