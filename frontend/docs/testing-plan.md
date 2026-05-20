# Frontend Testing Plan

This plan tracks the next frontend testing work for Bloomify. It follows the standards in [Testing](./testing.md), [Data Fetching](./data-fetching.md), [Forms](./forms.md), [State Management](./state-management.md), [API And Errors](./api-and-errors.md), and [Semantic HTML And Accessibility](./semantic-accessibility.md).

## Current Baseline

Last measured with `npm run test:coverage`:

- Test files: 37 passed
- Tests: 178 passed
- Statements: 92.2%
- Lines: 92.82%
- Branches: 77.17%
- Functions: 85.15%

The current suite covers many happy paths, but branch and function coverage show that error states, edge cases, selectors, hooks, and API normalization need more attention.

## Testing Principles

- Prefer the smallest test that proves the behavior.
- Use Testing Library for user-visible React behavior.
- Use MSW for HTTP boundaries instead of mocking Axios inside components.
- Use pure unit tests for schemas, helpers, query-key factories, stores, and selectors.
- Keep fixtures static, factories configurable, and mocks focused on side effects.
- Test accessible behavior through roles, labels, visible text, and user actions.
- Do not write broad snapshots.

## Priority 1 - Auth Flow

Goal: protect login/register/profile behavior before backend auth is implemented.

Add or extend tests for:

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

## Priority 2 - Checkout Flow

Goal: protect payment selection, LiqPay handoff, cash-on-delivery, and draft persistence.

Add or extend tests for:

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

## Priority 3 - Catalog Filters, Query Params, And Query Hooks

Goal: cover the lower-coverage catalog query state and hook behavior.

Add or extend tests for:

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
- [ ] catalog UI
  - [x] filters visible bouquets by search text
  - [x] empty state after filtering
  - [x] error state when query fails
  - [ ] favorite/cart interactions remain keyboard-accessible

Done when:

- Catalog query-param helpers and query hooks have focused tests.
- Main user interactions are covered through Testing Library.

## Priority 4 - API And Error Utilities

Goal: make error normalization predictable across frontend services.

Add tests for:

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

## Priority 5 - Navigation, Locale, And Hash Scrolling

Goal: prevent regressions in localized routes and anchor navigation.

Add or extend tests for:

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

Done when:

- Anchor navigation behavior is covered without relying on browser screenshots.
- Locale switching preserves path, query, and hash.

## Priority 6 - UI Components And Accessibility

Goal: cover reusable UI behavior that can break many screens.

Add tests for:

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

Done when:

- Shared UI behavior is protected by role/label based tests.
- Accessibility contracts are asserted where they matter.

## Priority 7 - Coverage Hygiene And Test Infrastructure

Goal: keep future tests maintainable.

Add or improve:

- [x] feature factories for auth responses, checkout payloads, and catalog params
- [x] shared helpers for API URLs and deferred promises
- [x] reset helpers for repeated catalog store setup
- [ ] MSW handlers grouped by domain when repeated
- [ ] coverage thresholds after weak areas are improved
- [ ] documentation examples for adding a new feature test

Done when:

- New tests use fixtures/factories instead of inline large objects.
- Repeated MSW setup is extracted only where it reduces real duplication.

## Execution Order

1. Auth flow tests.
2. Checkout draft and payment tests.
3. Catalog query params, store, and hook tests.
4. API/error utility tests.
5. Navigation, locale, and hash-scroll tests.
6. Shared UI/accessibility tests.
7. Infrastructure cleanup and coverage threshold decision.

## Commands

Run focused tests while working:

```bash
npm run test:unit -- path-or-pattern
```

Run frontend checks before committing:

```bash
npm run test:coverage
npm run typecheck
npm run lint
npm run build
```

From repository root:

```bash
make frontend-test-coverage
make frontend-typecheck
make frontend-lint
make frontend-build
```
