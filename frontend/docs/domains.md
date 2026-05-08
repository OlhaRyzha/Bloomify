# Frontend Domains

Bloomify uses feature-first organization. Domain code should stay close to the owning feature, while truly reusable primitives live in `src/components` or `src/utils`.

## Domain Ownership

### Catalog

Path: `src/features/catalog`

Owns:

- catalog grid
- catalog card
- search, sort, filters, pagination state
- catalog query params
- catalog-specific skeletons

Rules:

- Catalog list UI may be client-side when it needs search, filters, pagination, URL sync, favorites, or cart actions.
- Keep query-param parsing and URL sync inside catalog-owned files.
- Product API services, query keys, and query hooks live in `src/features/catalog/api`.
- Catalog card can be client-side because favorite toggles and cart actions are interactive.

### Product Details

Path: `src/features/product` and `src/app/catalog/[id]`

Owns:

- product detail presentation
- product skeleton
- product route hydration client component

Rules:

- Route `page.tsx` should stay a Server Component.
- Detail data should be loaded on the server and passed as props when the detail screen can render from server data.
- Use TanStack Query hydration only when product detail data must also be client-owned query cache after first render.
- The smallest route client component should own interactive controls such as cart and favorites actions.
- Product presentation should use semantic `article`, `figure`, `header`, and meaningful sections.

### Cart

Path: `src/features/cart`

Owns:

- cart item list
- quantity updates
- local cart persistence
- checkout summary trigger
- cart skeletons

Rules:

- Cart state belongs in a scoped Zustand store.
- Persist only minimal cart data, usually item id and quantity.
- Do not persist full product snapshots unless offline behavior explicitly requires it.
- Quantity controls must be keyboard-accessible buttons with labels.
- Empty cart must have a clear empty state and a route back to catalog.

### Favorites

Path: `src/features/favorites`

Owns:

- favorite product ids
- favorite list UI
- local favorites persistence

Rules:

- Persist ids only.
- Product details should be read from catalog/product data, not duplicated in the store.
- Favorite toggles must expose `aria-pressed` and clear accessible labels.
- Hydration-sensitive UI should avoid mismatches between server HTML and persisted client state.

### Subscription

Path: `src/features/subscription` and subscription sections

Owns:

- subscription plans
- subscription landing section
- subscription selection flow
- future subscription API mutations

Rules:

- Static marketing plan layout can be server-rendered unless animation or interactive selection requires a Client Component.
- Subscription form or purchase flow should be a dedicated Client Component.
- Future subscription mutations should use TanStack Query mutations and invalidate or update subscription query keys.

### Auth

Path: `src/features/auth`

Owns:

- login UI
- registration UI
- auth form fields
- auth validation

Rules:

- Forms use Formik for form state and Zod for validation.
- Auth forms must use real labels, correct `autoComplete`, visible errors, and `aria-describedby`.
- Auth mutations should be added through service functions and TanStack Query mutation hooks.
- Do not store tokens in generic feature stores; auth persistence must be designed as a dedicated security boundary.

### Checkout

Path: `src/features/checkout`

Owns:

- checkout flow
- delivery/contact/payment form sections
- order summary integration

Rules:

- Checkout should be split into semantic form sections.
- Form data should be validated with Zod.
- Mutations should submit through service functions, not directly from components.
- Errors must be mapped to field-level or form-level feedback.

### Shared UI

Path: `src/components/ui`

Owns:

- design-system primitives
- accessible wrappers around Radix or native controls
- reusable buttons, inputs, cards, badges, skeletons, toasts

Rules:

- Shared UI components must stay domain-agnostic.
- Do not import feature stores, API services, or domain copy into shared UI.
- Shared UI should expose accessible defaults and let features provide labels/content.

## Boundary Rules

- Feature components can import shared UI.
- Shared UI must not import feature code.
- Feature stores should not import components.
- Service/API code should not import UI, except current legacy toast behavior that should be treated as a cleanup target.
- Prefer direct imports from owning files over broad barrel exports.
