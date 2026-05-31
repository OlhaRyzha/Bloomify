# Bloomify Frontend Docs

This folder describes the target frontend standards for Bloomify. Treat these documents as the reference for new work and refactoring. Some existing code may not fully match the target yet; when touching an area, move it toward these rules without broad unrelated rewrites.

## Docs Map

- [Frontend Architecture](./frontend-architecture.md) - Next.js App Router, server/client boundaries, hydration, imports.
- [Domains](./domains.md) - feature ownership for catalog, product, cart, favorites, subscription, auth, checkout, and shared UI.
- [Semantic HTML And Accessibility](./semantic-accessibility.md) - markup, ARIA, keyboard, errors, loading and empty states.
- [Design System](./design-system.md) - Bloomify visual tokens, shadcn/ui reuse, component styling, layout rhythm.
- [Data Fetching](./data-fetching.md) - server route data, TanStack Query hydration, query keys, mutations.
- [Forms](./forms.md) - Formik + Zod standards.
- [State Management](./state-management.md) - Zustand store rules.
- [API And Errors](./api-and-errors.md) - services, schema validation, `ApiError`, user feedback.
- [Auth Architecture](./auth.md) - sign-in/sign-up flow, token handling, route guards, and future Django auth contract.
- [Analytics](./analytics.md) - product analytics ownership, privacy rules, event taxonomy, funnel analysis.
- [Testing](./testing.md) - Vitest, Testing Library, MSW, fixtures, factories, mocks.
- [Frontend Testing Plan](./testing-plan.md) - prioritized gaps and execution order for improving frontend tests.
- [Performance](./performance.md) - bundle budget, visual regression baseline, and CI performance gates.

## Default Workflow

Before changing frontend code:

1. Read this index.
2. Read only the document relevant to the task.
3. Inspect the current feature implementation.
4. Make the smallest change that moves the code toward the documented target.
5. Run the relevant checks from the repository root.

```bash
make frontend-lint
make frontend-typecheck
make frontend-test
make frontend-build
```

Use `make frontend-build` when routes, Server Components, Client Components, hydration, or API boundaries changed.
