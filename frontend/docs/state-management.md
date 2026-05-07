# State Management

Bloomify uses Zustand for client state that is local to the browser and not owned by the server.

## What Belongs In Zustand

Use Zustand for:

- cart ids and quantities
- favorite ids
- client-only filters that must survive navigation
- local UI preferences
- short-lived wizard state when URL or Formik is not a better fit

Do not use Zustand for:

- server data that should come from TanStack Query
- API loading/error state
- form field state that belongs in Formik
- derived data that can be computed from query data
- authentication/token storage without an explicit security design

## Store Ownership

Stores should live next to the feature that owns them:

```text
src/features/cart/store/cart.store.ts
src/features/cart/store/cart.selectors.ts
src/features/favorites/store/favorites.store.ts
src/features/favorites/store/favorites.selectors.ts
src/features/catalog/store/catalog.store.ts
src/features/catalog/store/catalog.selectors.ts
```

Shared stores are allowed only when multiple unrelated features truly own the same client state.

## Store Shape

Keep stores minimal and serializable.

Good cart state:

```ts
type CartItem = {
  id: string;
  quantity: number;
};
```

Avoid storing full product objects in persistent stores. Product name, price, description, and image should come from API/query data unless offline behavior explicitly requires snapshots.

## Persist Rules

When using `persist`:

- persist only the fields that must survive reload
- use `partialize`
- version persisted state when migrations are likely
- avoid sensitive data
- design for hydration mismatch in the UI

Hydration-sensitive UI should avoid rendering persisted-dependent state as final server HTML. Use a hydration guard when necessary.

## Actions

Store actions should:

- validate input at the boundary
- keep updates immutable
- avoid side effects like API calls or toasts
- keep business rules close to the store when they only affect that store

Side effects belong in components, hooks, or mutation handlers.

## Selectors

Selectors should live in a separate `*.selectors.ts` file next to the store. Components should import named selectors instead of writing inline selector functions repeatedly.

Prefer narrow selectors for one-off values:

```ts
const cartCount = useCartStore(selectCartCount);
const addItem = useCartStore(selectAddCartItem);
```

For a component or hook that always needs a stable group of state and actions, create a grouped view selector and use shallow equality:

```ts
const { page, perPage, sort, setPage } = useCatalogStore(
  useShallow(selectCatalogGridState)
);
```

Avoid selecting the whole store in large components because it increases re-renders and hides dependencies.

Avoid anonymous inline selectors in components. Add a named selector to the feature `*.selectors.ts` file instead.

## Current Project Notes

`cart/store`, `favorites/store`, and `catalog/store` follow the current target by colocating each store with selectors in the owning feature. Future cleanup should consider adding store versioning if persisted data shape changes.
