# Bloomify Frontend

Bloomify frontend is a Next.js App Router application.

## Development

Run the development server from `frontend`:

```bash
npm run dev
```

From the repository root, prefer the shared Makefile commands:

```bash
make start
make frontend-lint
make frontend-typecheck
make frontend-build
```

## Architecture

- App routes live in `src/app`.
- Shared UI lives in `src/components`.
- Feature code lives in `src/features`.
- Feature API code lives in the owning feature, for example `src/features/catalog/api`.
- Shared API infrastructure lives in `src/services/api`.
- TanStack Query hooks live next to the owning feature API.
- Client state stores stay close to the owning feature in `store/` folders.

Server Components are the default. Add `"use client"` only when a component needs browser APIs, React client hooks, client stores, TanStack Query hooks, event handlers, or runtime animation.

For route data, prefer a server `page.tsx` that prefetches data and passes it through `HydrationBoundary`, then keep `useQuery` in the smallest necessary Client Component.

Start with [Frontend Docs](./docs/README.md). The docs cover architecture, domains, semantic HTML, accessibility, data fetching, forms, state management, API boundaries, and error handling.

## Quality Checks

Run these before finishing frontend work:

```bash
make frontend-lint
make frontend-typecheck
make frontend-build
```
