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

### When a Budget Fails

Do not blindly raise the budget. Instead:

1. **Identify the culprit:**

   ```bash
   npm run build
   ```

   Look at `.next/static/chunks/` and find the largest new files.
   Example: `packages-XXX.js` grew from 150KB to 180KB

2. **Find what added to the dependency:**

   Use `npm ls` or `npm explain` to trace the import:

   ```bash
   npm ls chart-library  # Show who depends on this
   npm explain framer-motion  # Show why it was installed
   ```

3. **Check the root cause:**

   - Did you add a dependency to `package.json`?
   - Did you add a `"use client"` directive near the app root?
   - Did you import a heavy library into a shared component?

4. **Fix strategy (in order of preference):**

   a. **Remove the dependency** (best)
      - Was this feature essential? Can you ship without it?

   b. **Move import to route-level Client Component** (good)
      - Instead of importing in `Header` (used everywhere), import in the route that needs it
      - Wrap only that page's form in a Client Component

   c. **Lazy-load with dynamic()** (ok)
      ```tsx
      const HeavyChart = dynamic(() => import('@/features/charts/heavy'), {
        ssr: false,  // Don't include in server bundle
      });
      ```

   d. **Replace with lighter alternative** (consider)
      - Use `date-fns` instead of `moment`
      - Use `clsx` instead of `classnames`

   e. **Only then: Raise the budget**
      - Document WHY in the `performance-budget.json` comment
      - New budget should have a ticket tied to future reduction

### Monitoring

Performance budget is checked in CI on every build:

```yaml
# .github/workflows/frontend-ci.yml
- name: Performance budget
  run: cd frontend && npm run performance:budget
```

**On PR:**

- CI shows ✅ or ❌ against the current budget
- If ❌, the build fails and PR cannot merge
- Diff is shown in the `frontend build` step

**On Main:**

- Budget acts as a guard rail
- Protects against gradual bundle creep
- If you need to raise budget, do it deliberately with team discussion

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
