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

Query keys live in `src/constants/query-keys.constants.ts`.

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

Query hooks live in `src/hooks/tan-stack-query`.

Rules:

- Hooks should wrap service functions.
- Hooks should type data and errors.
- Hooks should accept options when route-level behavior needs overrides.
- Hooks should not hide important query key variables.

Example:

```ts
export const useGetProductById = (id: string, options?: GetProductOptions) => {
  const { locale } = useLocale();

  return useQuery<ProductItem, ApiError>({
    queryKey: productsQueryKeys.detail(id, locale),
    queryFn: () => ProductsService.getProductById(id),
    enabled: Boolean(id),
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
- update relevant query data from the backend response when the response is authoritative
- invalidate query keys only when the backend response is not enough to repair the cache
- show user feedback at the hook/component boundary
- convert unknown errors into `ApiError`

For cart and favorites, local Zustand actions are acceptable because the current behavior is local-only. If backend persistence is added, introduce mutation hooks and sync carefully.

### List Mutations

Use `useOptimisticListMutation` for mutations that affect cached lists.

Rules:

- Do not refetch lists by default after every mutation.
- Prefer `cache.updateFromResponse` when the backend returns the created or updated entity.
- Use `cache.optimisticUpdate` only when rollback is simple and the user benefits from immediate UI feedback.
- Use `cache.invalidateList: true` only when the list can change in ways the response cannot describe.
- Use `cache.invalidateQueries` for related data that must be refreshed, such as detail views or counters.
- Pass explicit `mutationKey` from mutation key factories.

Create/update example:

```ts
useOptimisticListMutation<ProductItem, { item: ProductItem }, ProductItem>({
  queryKey: productsQueryKeys.list(locale),
  mutationKey: productsMutationKeys.create,
  mutationFn: ({ item }) => ProductsService.createProduct(item),
  cache: {
    updateFromResponse: (items, product) => upsertProduct(items, product),
  },
  toast: {
    successMessage: 'Product created',
  },
});
```

Delete example:

```ts
useOptimisticListMutation<ProductItem, { id: string }, void>({
  queryKey: productsQueryKeys.list(locale),
  mutationKey: productsMutationKeys.delete,
  mutationFn: ({ id }) => ProductsService.deleteProduct(id),
  cache: {
    optimisticUpdate: (items, { id }) =>
      items.filter((item) => item.id !== id),
  },
  toast: {
    successMessage: 'Product deleted',
  },
});
```

This keeps the fast UI update for safe cases and avoids unnecessary network refetches when the cache can be updated accurately.

## Loading And Error States

Every query surface should handle:

- loading
- error
- empty data
- success

Use skeletons when the layout shape is predictable. Use inline errors when only one section failed. Avoid blank screens.

## Current Project Notes

The product detail route follows the target pattern: server prefetch in `app/catalog/[id]/page.tsx`, hydrated client read in `ProductDetails.client.tsx`.
