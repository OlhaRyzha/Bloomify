# Analytics

Bloomify uses a project-owned analytics layer. Feature code must not import
third-party analytics SDKs directly.

## Current Provider Model

Bloomify supports these providers:

- `noop`: default local and test provider. It records nothing.
- `vercel`: production provider through `@vercel/analytics`.

Provider selection is controlled by env:

```env
NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_PUBLIC_ANALYTICS_PROVIDER=noop
```

Production env uses:

```env
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ANALYTICS_PROVIDER=vercel
```

If analytics is disabled or an unsupported provider is configured, the app must
fall back to the no-op behavior.

## Production Activation

Production analytics is enabled only through environment configuration:

```env
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ANALYTICS_PROVIDER=vercel
```

Local development, test runs, and CI use:

```env
NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_PUBLIC_ANALYTICS_PROVIDER=noop
```

Do not enable analytics in tests to validate product behavior. Tests validate
the analytics layer by mocking the provider boundary.

## Architecture

The analytics code lives under:

```text
frontend/src/services/analytics/
  analytics.config.ts
  analytics-event.tsx
  analytics.events.ts
  analytics.helpers.ts
  analytics.service.ts
  analytics.types.ts
  providers/
    noop.provider.ts
    vercel.provider.ts
```

Responsibilities:

- `analytics.types.ts`: event names and payload contracts.
- `analytics.service.ts`: provider-neutral `Analytics.track` boundary.
- `analytics.events.ts`: domain-level event functions used by features.
- `analytics-event.tsx`: reusable component for one-time view/on-mount events.
- `analytics.helpers.ts`: mapping from domain models to analytics payloads.
- `providers/*`: vendor-specific implementation details only.

Feature code must call domain event functions, for example:

```ts
trackCartItemAdded({
  item,
  quantity: 1,
  source: 'catalog_card',
  locale,
});
```

Feature code must not call:

```ts
Analytics.track('add_to_cart', payload);
```

Direct `Analytics.track` calls belong inside `analytics.events.ts` or provider
tests only.

## Reusable View Tracking

Use `AnalyticsEvent` for one-time view events:

```tsx
<AnalyticsEvent
  dedupeKey={`${locale}:${product.id}`}
  track={() => {
    trackProductViewed({ item: product, locale });
  }}
/>
```

Use a stable `dedupeKey` for events that must fire once per loaded entity or
state. Do not use random values as dedupe keys.

## Event Names

Supported event names:

- `view_item_list`
- `select_item`
- `view_item`
- `search`
- `filter_catalog`
- `sort_catalog`
- `add_to_cart`
- `remove_from_cart`
- `view_cart`
- `begin_checkout`
- `checkout_submit`
- `purchase`
- `payment_failed`
- `newsletter_subscribe`
- `auth_sign_in`
- `auth_sign_up`
- `auth_sign_out`

Event names are lowercase snake_case and are stable contracts. Do not rename an
event without documenting a migration.

## Funnel

The primary Bloomify funnel is:

```text
view_item_list
  -> select_item
  -> view_item
  -> add_to_cart
  -> view_cart
  -> begin_checkout
  -> checkout_submit
  -> purchase
```

Analyze this funnel by:

- locale
- device type from provider dashboard
- product tag/category
- payment method
- source page
- traffic source/referrer from provider dashboard

Weekly funnel review must calculate:

- `select_item / view_item_list`
- `add_to_cart / view_item`
- `begin_checkout / view_cart`
- `checkout_submit / begin_checkout`
- `purchase / checkout_submit`
- `payment_failed / checkout_submit`

Large changes in these rates must be compared with the release timeline,
Sentry issues, CI/deploy incidents, and recent UI or checkout changes.

## Privacy Rules

Never send these values to analytics:

- email
- phone
- customer name
- delivery address
- raw payment payloads
- LiqPay signatures
- access tokens
- refresh tokens
- full unreviewed error objects
- free-form user text that may contain personal data

Allowed fields:

- product id
- product name
- product category/tag
- price
- quantity
- currency
- locale
- source page/action
- payment method type without card details
- order id when needed for purchase de-duplication

Search analytics must not send raw search text. Track only normalized metadata:

- query length
- result count
- whether results exist
- locale

## Tracking Boundaries

- Track `view_item_list` after catalog data loads successfully.
- Track `select_item` when a user opens product details from a catalog card.
- Track `view_item` after product detail data is available.
- Track `add_to_cart` only after cart state changes.
- Track `remove_from_cart` only after item quantity decreases or item removal is
  confirmed.
- Track `view_cart` when a hydrated non-empty cart is shown.
- Track `begin_checkout` once when a hydrated checkout with items is shown.
- Track `checkout_submit` when valid checkout submission starts.
- Track `purchase` only after backend order creation succeeds for non-external
  payment handoff flows.
- Track `payment_failed` when checkout submission fails.
- Track `newsletter_subscribe` only after subscribe request succeeds.
- Track auth events only after auth action succeeds.

## Analysis Rules

Analytics reports must answer concrete questions:

- Which products are viewed but not added to cart?
- Which products are removed from cart most often?
- Where is checkout drop-off highest?
- Is mobile conversion lower than desktop conversion?
- Which locale has the weakest checkout conversion?
- Which search patterns produce no results?
- Which payment methods fail most often?
- Do Sentry error spikes correlate with conversion drops?

Prefer rates over raw counts:

- product detail to cart conversion
- cart to checkout conversion
- checkout submit to purchase conversion
- payment failure rate
- empty-search rate
- mobile vs desktop conversion delta

Compare before/after changes across equivalent time windows.

## Dashboard Usage

Use the provider dashboard for product questions in this order:

1. Check whether traffic volume is healthy enough for the period.
2. Review the primary funnel conversion rates.
3. Segment the weakest step by device, locale, source page, product category,
   and payment method.
4. Compare the result with the previous equivalent period.
5. Check Sentry and deploy history before deciding that a UX change caused the
   movement.

Standard weekly notes must include:

- time window
- overall session/page-view trend
- primary funnel rates
- weakest funnel step
- strongest and weakest product/category
- mobile versus desktop delta
- payment failure rate
- proposed product or technical action

## Testing Rules

- Mock analytics providers in unit and e2e tests.
- Assert domain event functions where behavior depends on analytics mapping.
- Assert sensitive fields are not sent when adding new events.
- Tests must not depend on third-party analytics network calls.
- Disabled analytics must use no-op behavior.

## Adding A New Event

When adding a new event:

1. Add the event name and payload contract to `analytics.types.ts`.
2. Add a domain function to `analytics.events.ts`.
3. Use that domain function from feature code.
4. Keep provider-specific mapping inside `providers/*`.
5. Add or update tests for the event mapping.
6. Update this document if the event is part of a supported product funnel.

## Anti-Patterns

- Importing `@vercel/analytics` outside `services/analytics`.
- Calling `Analytics.track` directly from feature components.
- Sending PII or raw form values.
- Tracking every click without a product question.
- Using analytics side effects for application behavior.
- Tracking purchase before backend order creation succeeds.
- Mixing Sentry error monitoring with product conversion events.
