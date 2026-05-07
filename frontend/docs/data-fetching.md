# Data Fetching

Bloomify uses TanStack Query for server state.

## What Is Server State

Server state includes:

- catalog products
- product details
- future user profile data
- future subscriptions
- future orders
- future auth-backed account state

Server state should not be duplicated in Zustand. Zustand can store selected ids and local preferences; TanStack Query owns remote data.

## Query Keys

Query keys live next to the feature API that owns the server state. For catalog products, use `src/features/catalog/api/query-keys.ts`.

Rules:

- Use query key factories, not scattered inline arrays.
- Include all variables that change the response.
- Include locale when translated API data changes by locale.
- Reuse the same query key for server prefetch and client `useQuery`.
- Keep list and detail keys under the same domain root.
- Use mutation key helpers for create, update, and delete operations.

Example:

```ts
export const productsQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productsQueryKeys.all, 'list'] as const,
  list: (locale: Locale) => [...productsQueryKeys.lists(), locale] as const,
  details: () => [...productsQueryKeys.all, 'detail'] as const,
  detail: (id: string, locale: Locale) =>
    [...productsQueryKeys.details(), id, locale] as const,
};
```

## Query Hooks

Query hooks live next to the owning feature API, for example `src/features/catalog/api/use-products.ts`. Shared TanStack Query infrastructure belongs in `src/shared/query` when it is truly reusable across domains.

Rules:

- Hooks should wrap service functions.
- Hooks should type data and errors.
- Hooks should accept options when route-level behavior needs overrides.
- Hooks should not hide important query key variables.
- Hooks should pass request variables that match the query key, such as locale.
- Hooks with local skeleton or inline loading UI should opt out of the global loader with `meta: { showGlobalLoader: false }`.

Example:

```ts
export const useGetProductById = (id: string, options?: GetProductOptions) => {
  const { locale } = useLocale();

  return useQuery<ProductItem, ApiError>({
    queryKey: productsQueryKeys.detail(id, locale),
    queryFn: () => ProductsService.getProductById(id, { lang: locale }),
    enabled: Boolean(id),
    meta: { showGlobalLoader: false },
    ...options,
  });
};
```

## Server Prefetch And Hydration

Use server prefetch for route-critical data, especially detail pages.

Rules:

- Create a new `QueryClient` per server request.
- Prefetch in the Server Component route.
- Pass dehydrated state through `HydrationBoundary`.
- Read the same data from a small Client Component with the same query key.
- Use `refetchOnMount: false` when hydrated data is fresh enough.
- Use the domain query key factory in both places.

Do not turn the whole page into a Client Component just to use `useQuery`.

## Global Query Loading

Bloomify uses a global query loader through `QueryLoader`.

Rules:

- The global loader should observe pending queries and mutations.
- It should delay visibility briefly to avoid flicker.
- Queries and mutations can opt out with `meta: { showGlobalLoader: false }`.
- Local loading UI still belongs in the component when the section needs a skeleton or inline state.

Example:

```ts
useQuery({
  queryKey: productsQueryKeys.list(locale),
  queryFn: () => ProductsService.getProducts(),
  meta: { showGlobalLoader: false },
});
```

## Mutations

Mutations should:

- call service functions
- use optimistic updates only when rollback is clear
- invalidate or update relevant query keys
- show user feedback at the hook/component boundary
- convert unknown errors into `ApiError`

Use `src/shared/query/use-optimistic-list-mutation.ts` for list mutations that can be safely updated in cache.

Rules:

- Do not refetch by default after an optimistic mutation.
- Use `updateFromResponse` when the backend returns the canonical item after create or update.
- Use `invalidate: true` only when the backend response is not enough to update the affected cache correctly.
- Keep `rollbackOnError` enabled unless the optimistic state is intentionally allowed to stay.
- Set `updateFromResponse: false` for void responses such as deletes.
- Keep mutation toast text localized in feature hooks or components.

Example:

```ts
useOptimisticListMutation<ProductItem, { id: string }, void>({
  queryKey: productsQueryKeys.list(locale),
  action: OPTIMISTIC_LIST_MUTATION_ACTIONS.DELETE,
  mutationFn: ({ id }) => ProductsService.deleteProduct(id),
  options: {
    updateFromResponse: false,
    toast: {
      showSuccessToast: true,
      successMessage: t('product_mutation_deleted_success'),
    },
  },
});
```

For cart and favorites, local Zustand actions are acceptable because the current behavior is local-only. If backend persistence is added, introduce mutation hooks and sync carefully.

## Loading And Error States

Every query surface should handle:

- loading
- error
- empty data
- success

Use skeletons when the layout shape is predictable. Use inline errors when only one section failed. Avoid blank screens.

## Current Project Notes

The product detail route is server-first: `app/catalog/[id]/page.tsx` loads the product on the server through the catalog service and renders the product surface as a Server Component. Client code is kept to interactive controls such as adding an item to the cart.
