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
- loading route-critical data
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

Keep animation libraries out of globally mounted components such as `Header`,
`Footer`, providers, and route shells unless the interaction genuinely requires
runtime animation. Prefer CSS transitions or conditional rendering for simple
menus and disclosures.

## Bundle And Client Component Audit

Current client boundaries should stay intentionally small:

- Route `page.tsx` files remain Server Components, except `global-error.tsx`
  which must be client-side by Next.js contract.
- Global providers are client-side only where required for React Query, locale,
  toast, and hydration-sensitive state.
- Header interactivity is isolated in `HeaderActions`; avoid importing heavy
  animation or data-fetching libraries there because it appears on every page.
- Feature-owned client surfaces are acceptable for cart, checkout, favorites,
  catalog filtering, auth forms, and persisted Zustand stores.
- Shared primitives such as `FeedbackState`, `QueryLoader`, `LocaleSwitcher`,
  and `AddToCartButton` are client-side because they own events, browser state,
  or query status.

Before adding a new Client Component:

- Check whether only a leaf control needs `"use client"`.
- Do not import Server Component helpers, large static sections, or feature
  pages into a Client Component.
- Do not add `framer-motion`, Formik, TanStack Query, or Zustand to a global
  component unless the global interaction needs that dependency.
- After broad client-boundary changes, run `make frontend-build` and inspect
  the route bundle output for unexpected shared JS growth.

## React Performance

Add memoization only when there is a clear need.

- Use `useMemo` for expensive derived values or stable references required by dependencies.
- Use `useCallback` when referential stability matters for a child, effect, subscription, or library API.
- Use `memo` only when a component has a proven re-render problem or expensive render path.
- Do not add memoization by default for simple values, small maps, or trivial handlers.

## Route Data Pattern

Prefer server-first route data when the page can render from server data and only small controls need client-side behavior.

```tsx
// app/catalog/[id]/page.tsx
import ProductsService from '@/features/catalog/api/products.service';
import ProductFeature from '@/features/product/product';
import { getServerTranslator } from '@/i18n/server';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CatalogItemPage({ params }: PageProps) {
  const { id } = await params;
  const { locale, t } = await getServerTranslator();
  const product = await ProductsService.getProductById(id, { lang: locale });

  return <ProductFeature product={product} copy={{ actionsLabel: t('product_actions_label') }} />;
}
```

Do not add TanStack Query hydration just because data is loaded on the route. A Server Component can load data and pass it as plain props when the data is only needed for the initial render.

Use TanStack Query hydration only when the same route-critical data must become client-owned server state after first render, for example live filters, mutations that update the same cache, background refetching, or cache sharing with other client query consumers.

```tsx
// app/notes/[id]/page.tsx
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { createQueryClient } from '@/services/queryClient';
import NoteDetailsClient from './note-details.client';

export default async function NoteDetailsPage() {
  const queryClient = createQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['note', id],
    queryFn: () => getNote(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NoteDetailsClient />
    </HydrationBoundary>
  );
}
```

The Client Component should use the same `queryKey` as the server prefetch. Use `refetchOnMount: false` when the server already hydrated fresh data for that route.

```tsx
// app/notes/[id]/note-details.client.tsx
'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

export default function NoteDetailsClient() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['note', id],
    queryFn: () => getNote(id),
    refetchOnMount: false,
  });

  if (isLoading) return null;
  if (error || !data) return null;

  return <NoteView note={data} />;
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
- Can server route data be passed as props instead of hydrated into TanStack Query?
- Is `HydrationBoundary` needed because the client must own the same query cache after first render?
- Does this component really need browser APIs or hooks?
- Will importing this file from a Client Component pull unnecessary static UI into the bundle?

Before finishing a frontend task:

- run `make frontend-lint`
- run `make frontend-typecheck`
- run `make frontend-build` when route behavior or server/client boundaries changed
