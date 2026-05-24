# Frontend Testing Status And Maintenance Plan

This document records the current frontend testing baseline for Bloomify and the remaining maintenance work. It follows the standards in [Testing](./testing.md), [Data Fetching](./data-fetching.md), [Forms](./forms.md), [State Management](./state-management.md), [API And Errors](./api-and-errors.md), and [Semantic HTML And Accessibility](./semantic-accessibility.md).

## Current Baseline

Last measured with `npm run test:coverage`:

- Test files: 42 passed
- Tests: 211 passed
- Statements: 92.31%
- Lines: 92.95%
- Branches: 78.01%
- Functions: 85.71%

Last measured with `npm run test:e2e`:

- Browser smoke and visual tests: 15 passed
- Covered flows: localized anchor navigation, mobile navigation, catalog API rendering, catalog product details, anonymous profile redirect, cart-to-checkout, cash-on-delivery checkout, favorites persistence, keyboard focus behavior, and responsive visual screenshots

Last measured with `npm run test:e2e:a11y`:

- Axe accessibility smoke tests: 5 passed
- Covered states: home, catalog, product details, sign-in, cart, favorites, and checkout

Coverage thresholds enforced by Vitest:

- Statements: 90%
- Lines: 90%
- Branches: 75%
- Functions: 80%

The current suite covers the main frontend risk areas: auth flow, checkout and payment handoff, catalog query state, API error normalization, localized navigation, hash scrolling, and shared UI accessibility. Remaining work should focus on keeping coverage stable as features change, not chasing 100% line coverage.

## Current Status

- [x] Auth service, auth form, token/session marker, and profile routing are covered.
- [x] Checkout delivery draft, payment methods, LiqPay handoff, cash-on-delivery, loading, and API errors are covered.
- [x] Catalog query params, catalog store, product query hooks, filtering, empty state, and error state are covered.
- [x] Shared API/error utilities are covered.
- [x] Locale switching, header actions, and hash scrolling are covered.
- [x] Shared UI/accessibility coverage exists for add-to-cart, pagination, query loader, and newsletter form.
- [x] Test helpers/factories exist for repeated auth, checkout, catalog, API URL, and deferred-promise setup.
- [x] Playwright smoke coverage exists for route-level browser behavior.
- [x] Playwright mock API uses environment-driven frontend/API URLs.
- [x] Axe accessibility smoke coverage exists for critical pages and cart/favorites/checkout states.
- [x] Responsive visual regression baseline exists for home, catalog, and checkout.
- [x] Performance budget is enforced after production build.

## Testing Principles

- Prefer the smallest test that proves the behavior.
- Use Testing Library for user-visible React behavior.
- Use MSW for HTTP boundaries instead of mocking Axios inside components.
- Use pure unit tests for schemas, helpers, query-key factories, stores, and selectors.
- Keep fixtures static, factories configurable, and mocks focused on side effects.
- Test accessible behavior through roles, labels, visible text, and user actions.
- Do not write broad snapshots.

## Completed Area 1 - Auth Flow

Goal: protect login/register/profile behavior before backend auth is implemented.

Covered tests:

- [x] `AuthService`
  - [x] accepts both `access` and `access_token` response shapes
  - [x] rejects missing token response as `ApiError`
  - [x] calls `sign-in`, `sign-up`, refresh, and logout endpoints with expected payloads
- [x] `ApiClient` auth integration
  - [x] attaches `Authorization: Bearer <token>` when the memory token exists
  - [x] does not attach auth headers to external allowlisted hosts
- [x] auth session marker
  - [x] `setAuthSessionCookie` writes only a non-sensitive marker
  - [x] `clearAuthSessionCookie` expires the marker
- [x] `AuthForm`
  - [x] successful sign up payload excludes `confirmPassword`
  - [x] form-level API errors are displayed and preserve field values
  - [x] submit button disables during pending submit
- [x] profile routing
  - [x] `/profile` guard uses session marker cookie
  - [x] redirect keeps `next`

Done when:

- Auth service/API boundary is covered with MSW or focused service tests.
- Login and signup form success and failure paths are covered.
- No token is persisted to `localStorage`.

## Completed Area 2 - Checkout Flow

Goal: protect payment selection, LiqPay handoff, cash-on-delivery, and draft persistence.

Covered tests:

- [x] checkout draft store
  - [x] stores delivery fields only
  - [x] does not persist payment method or cart data
  - [x] reset clears draft values
- [x] checkout form schema
  - [x] validates required delivery fields
  - [x] accepts optional delivery note
  - [x] accepts all supported payment methods
- [x] checkout UI
  - [x] skeleton appears during cart hydration/loading
  - [x] delivery draft restores after reload/hydration
  - [x] cash-on-delivery does not submit LiqPay form
  - [x] LiqPay methods submit hidden `data` and `signature`
  - [x] API errors render form-level error and preserve user input
- [x] checkout service
  - [x] posts expected payload
  - [x] normalizes invalid response into `ApiError`

Done when:

- Online payment and cash-on-delivery paths are both tested.
- Draft persistence is tested at store level and one UI restoration path.

## Completed Area 3 - Catalog Filters, Query Params, And Query Hooks

Goal: cover the lower-coverage catalog query state and hook behavior.

Covered tests:

- [x] `catalog-query-params`
  - [x] parses missing and invalid params safely
  - [x] serializes search, tag, sort, and page changes
  - [x] removes default/empty params
- [x] catalog store/selectors
  - [x] selected filters and pagination selectors return stable values
  - [x] page reset actions return pagination to defaults where expected
- [x] `use-catalog-grid-state`
  - [x] hydrates from URL params
  - [x] updates URL params on search changes
  - [x] resets page when debounced search changes
  - [x] resets invalid tag to `all`
  - [x] filters and sorts catalog items
- [x] `use-products`
  - [x] uses locale-aware query keys
  - [x] passes locale to `ProductsService`
  - [x] does not fetch details when id is empty
- [x] catalog UI
  - [x] filters visible bouquets by search text
  - [x] empty state after filtering
  - [x] error state when query fails
  - [x] add-to-cart interactions remain keyboard-accessible through shared `AddToCartButton` coverage
  - [x] favorite toggle exposes accessible pressed state and label changes

Done when:

- Catalog query-param helpers and query hooks have focused tests.
- Main user interactions are covered through Testing Library.

## Completed Area 4 - API And Error Utilities

Goal: make error normalization predictable across frontend services.

Covered tests:

- [x] `ApiError.fromAxios`
  - [x] 400, 401, 403, 404, 409, 422, 429, 500
  - [x] timeout and network errors
  - [x] unknown non-Axios errors
- [x] `safeRequest` and `safeVoidRequest`
  - [x] return success values
  - [x] throw normalized `ApiError`
  - [x] show toast only when requested
- [x] `parseResponseWithSchema`
  - [x] returns parsed data
  - [x] throws validation `ApiError`
- [x] `clean-params`, `get-host`, and guards
  - [x] cover branch-heavy small helpers

Done when:

- API utility branch coverage improves materially.
- Services can rely on shared error behavior without duplicating tests.

## Completed Area 5 - Navigation, Locale, And Hash Scrolling

Goal: prevent regressions in localized routes and anchor navigation.

Covered tests:

- [x] `HashScrollHandler`
  - [x] scrolls to target on initial hash
  - [x] scrolls after hashchange
  - [x] handles same-path hash link clicks
  - [x] ignores external links and empty hashes
- [x] `LocaleSwitcher`
  - [x] keeps current path and hash when switching locale
  - [x] preserves query params
- [x] `HeaderActions`
  - [x] profile link points to localized `/profile`
  - [x] mobile auth action points to `/sign-in`
  - [x] mobile menu closes after navigation
- [x] Playwright route smoke
  - [x] localized contact anchor scrolls into view
  - [x] mobile menu opens, moves focus to the first link, closes after anchor navigation
  - [x] anonymous `/profile` redirects to localized sign-in with `next`

Done when:

- Anchor navigation behavior is covered without relying on browser screenshots.
- Locale switching preserves path, query, and hash.

## Completed Area 6 - UI Components And Accessibility

Goal: cover reusable UI behavior that can break many screens.

Covered tests:

- [x] `AddToCartButton`
  - [x] accessible label and pressed/quantity states
  - [x] disabled/loading behavior if applicable
- [x] pagination components
  - [x] visible page range
  - [x] previous/next disabled states
  - [x] `aria-current`
- [x] `QueryLoader`
  - [x] delayed display
  - [x] respects `showGlobalLoader: false`
- [x] footer newsletter form
  - [x] successful submit
  - [x] failed submit
  - [x] disabled state while submitting
- [x] axe accessibility smoke
  - [x] home, catalog, product details, and sign-in pages
  - [x] cart, favorites, and checkout persisted states
  - [x] color contrast remains enabled; fix tokens/components instead of suppressing failures

Done when:

- Shared UI behavior is protected by role/label based tests.
- Accessibility contracts are asserted where they matter.

## Remaining Maintenance - Coverage Hygiene And Test Infrastructure

Goal: keep future tests maintainable and prevent regressions.

Add or improve:

- [x] feature factories for auth responses, checkout payloads, and catalog params
- [x] shared helpers for API URLs and deferred promises
- [x] reset helpers for repeated catalog store setup
- [x] Playwright smoke tests for key route-level flows
- [ ] MSW handlers grouped by domain if more repeated endpoint setup appears
- [x] coverage thresholds after the team agrees on minimums
- [x] dedicated axe e2e command
- [x] dedicated visual regression e2e command
- [x] frontend bundle/performance budget command
- [x] Playwright mock API for route-level tests
- [x] jsdom setup mocks for scroll, pointer capture, and same-document test navigation
- [ ] documentation examples for adding a new feature test

Done when:

- New tests use fixtures/factories instead of inline large objects.
- Repeated MSW setup is extracted only where it reduces real duplication.
- Coverage thresholds are enforced in CI without making normal feature work noisy.

## Recommended Next Steps

1. Add a short documentation example for a new feature test using fixture, factory, MSW handler, and Testing Library query rules.
2. Extract MSW domain handlers only when another feature repeats the same endpoint setup.
3. Keep every new feature covered at the behavior boundary: schema/helper tests for pure logic, Testing Library for user behavior, MSW for API boundaries, and Playwright for critical route flows.
4. Re-run `npm run test:coverage` after meaningful feature work and update this baseline only when coverage changes materially.

## Commands

Run focused tests while working:

```bash
npm run test:unit -- path-or-pattern
```

Run frontend checks before committing:

```bash
npm run test:coverage
npm run test:e2e
npm run test:e2e:a11y
npm run test:e2e:visual
npm run typecheck
npm run lint
npm run build
```

From repository root:

```bash
make frontend-test-coverage
make frontend-test-e2e
make frontend-test-e2e-a11y
make frontend-test-e2e-visual
make frontend-performance-budget
make frontend-typecheck
make frontend-lint
make frontend-build
```
