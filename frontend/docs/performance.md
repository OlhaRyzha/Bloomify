# Frontend Performance And Bundle Budget

Bloomify uses a local production-build budget before adding deployment-based
Lighthouse checks. The goal is to catch accidental client bundle growth early,
especially from global Client Components and shared dependencies.

## Commands

From the repository root:

```bash
make frontend-performance-budget
make frontend-test-e2e-visual
```

From `frontend`:

```bash
npm run build
npm run performance:budget
npm run test:e2e:visual
```

Use `npm run test:e2e:visual -- --update-snapshots` only when the visual change
is intentional and reviewed.

## Bundle Budget

Budget config lives in `frontend/performance-budget.json`.

Current enforced limits:

- total static JS chunks gzip: 650 KB
- largest single JS chunk gzip: 190 KB
- root shared JS gzip: 330 KB

`scripts/check-performance-budget.mjs` reads `.next/static/chunks` and
`.next/build-manifest.json` after `next build`. If a budget is exceeded, the
script exits with a non-zero status and CI fails.

When a budget fails:

1. Inspect whether a Client Component pulled in a large dependency globally.
2. Check imports in `Header`, `Footer`, providers, route shells, and shared UI.
3. Move heavy dependencies behind route-level Client Components when possible.
4. Raise the budget only after a deliberate product decision.

## Visual Regression Baseline

Responsive screenshot baselines live next to the Playwright visual spec:

```txt
frontend/e2e/visual-responsive.spec.ts
frontend/e2e/visual-responsive.spec.ts-snapshots/
```

The baseline covers:

- home page: desktop and mobile
- catalog page: desktop and mobile
- checkout page with seeded cart: desktop and mobile

The screenshots target the `main` landmark to avoid unrelated browser chrome
and monitoring noise. Tests set `reducedMotion` before navigation and disable
animations during screenshot comparison.

## CI Expectations

Frontend CI should run:

- lint
- typecheck
- unit tests
- coverage
- build
- performance budget
- e2e smoke and visual tests
- axe accessibility tests

Playwright uses the mock API from `frontend/e2e/mock-api/server.mjs`; specs
should not depend on a local Django backend or production API.
