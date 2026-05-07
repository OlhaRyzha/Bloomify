# Frontend Architecture

Bloomify frontend uses Next.js App Router. Components are Server Components by default, and client-side code should be added only where the UI needs browser APIs, local state, effects, event handlers, client stores, or TanStack Query hooks.

Use this file for high-level architecture. For specific standards, also see:

- [Domains](./domains.md)
- [Semantic HTML And Accessibility](./semantic-accessibility.md)
- [Data Fetching](./data-fetching.md)
- [Forms](./forms.md)
- [State Management](./state-management.md)
- [API And Errors](./api-and-errors.md)

## Server And Client Boundaries

Use Server Components for:

- route `page.tsx` files
- metadata
- reading route params
- reading cookies
- prefetching data for the route
- static layout and semantic page structure

Use Client Components for:

- `useQuery`, `useMutation`, and query cache interactions
- Zustand stores
- `useState`, `useEffect`, and client-only derived state
- `useParams`, `useRouter`, and other client navigation hooks
- event handlers such as `onClick` and `onChange`
- browser APIs such as `window`, `document`, `localStorage`, and `history`
- animation libraries that require runtime interaction

Keep `"use client"` as low in the tree as possible. A Server Component can render a Client Component, but a Client Component pulls everything it imports into the client bundle.

## Runtime Animation

Use `MotionDiv` from `src/components/ui/motion-div.tsx` for animated `div` elements. It centralizes the SSR-safe `initial` behavior and avoids repeating direct `motion.div` setup in sections and features.

Direct `framer-motion` imports are acceptable when the element is not a `div`, or when the component needs APIs such as `AnimatePresence`.

## React Performance

Add memoization only when there is a clear need.

- Use `useMemo` for expensive derived values or stable references required by dependencies.
- Use `useCallback` when referential stability matters for a child, effect, subscription, or library API.
- Use `memo` only when a component has a proven re-render problem or expensive render path.
- Do not add memoization by default for simple values, small maps, or trivial handlers.

## TanStack Query Hydration Pattern

For detail pages, prefetch route data in the Server Component and hydrate it into the Client Component.

```tsx
// app/catalog/[id]/page.tsx
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import ProductDetailsClient from './product-details.client';
import ProductsService from '@/features/catalog/api/products.service';
import { productsQueryKeys } from '@/features/catalog/api/query-keys';
import { getServerTranslator } from '@/i18n/server';
import { createQueryClient } from '@/services/queryClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CatalogItemPage({ params }: PageProps) {
  const { id } = await params;
  const { locale } = await getServerTranslator();
  const queryClient = createQueryClient();

  await queryClient.prefetchQuery({
    queryKey: productsQueryKeys.detail(id, locale),
    queryFn: () => ProductsService.getProductById(id, { lang: locale }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetailsClient />
    </HydrationBoundary>
  );
}
```

The Client Component should use the same `queryKey` as the server prefetch. Use `refetchOnMount: false` when the server already hydrated fresh data for that route.

```tsx
// app/catalog/[id]/product-details.client.tsx
'use client';

import { useParams } from 'next/navigation';
import { useGetProductById } from '@/features/catalog/api/use-products';

export default function ProductDetailsClient() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useGetProductById(id, {
    refetchOnMount: false,
  });

  if (isLoading) return null;
  if (error || !data) return null;

  return <ProductView product={data} />;
}
```

## Semantic Markup

Prefer meaningful HTML over generic wrappers. The detailed standard lives in [Semantic HTML And Accessibility](./semantic-accessibility.md).

## Imports And Proxy Files

Avoid creating proxy-only files by default.

- Do not add barrel `index.ts` or `index.tsx` files just to re-export nearby modules.
- Do not create a folder only to hold a single component plus an `index.ts` proxy.
- Prefer direct imports from the owning file, such as `@/features/catalog/catalog-grid`, when that makes ownership clear.
- Use a barrel file only when the folder intentionally owns a stable public API used by many consumers.
- Keep route-level Client Components next to their Server Component route, for example `page.tsx` plus `product-details.client.tsx`.

Good reasons for a frontend barrel file:

- a shared UI package exports many primitives through one stable public surface
- a feature module exposes a small curated API while hiding internal files
- the existing local pattern already uses that boundary consistently

Bad reasons for a frontend barrel file:

- shortening one import path
- re-exporting a single component
- matching a habit from another project without a local need

## Refactor Checklist

Before adding `"use client"`:

- Can the parent stay server-rendered?
- Can only the button, form, or control be client-side?
- Can server route data be prefetched and hydrated?
- Does this component really need browser APIs or hooks?
- Will importing this file from a Client Component pull unnecessary static UI into the bundle?

Before finishing a frontend task:

- run `make frontend-lint`
- run `make frontend-typecheck`
- run `make frontend-build` when route behavior or server/client boundaries changed
