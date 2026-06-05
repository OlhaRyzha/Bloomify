# Bloomify

Bloomify is a full-stack flower shop application. It combines a Django REST API
with a Next.js storefront for browsing bouquets, managing favorites and cart
items, placing checkout orders, and testing LiqPay sandbox payments.

The project is built as a production-oriented ecommerce prototype: localized
catalog data, admin management, checkout flows, frontend quality checks,
security hardening, CI coverage, visual/e2e tests, and privacy-safe product
analytics are all part of the codebase.

## Highlights

- Localized bouquet catalog for Ukrainian, English, and Polish.
- Product details, favorites, cart, checkout, and cash-on-delivery flow.
- LiqPay sandbox payment handoff for card, Apple Pay, and Google Pay scenarios.
- Auth-ready frontend with sign-in/sign-up UI, protected profile route handling,
  token refresh behavior, and safe redirects.
- Django admin with Unfold for managing store content and operational data.
- Product analytics layer with provider-neutral events and privacy rules.
- Documented frontend architecture, design system, accessibility, testing, auth,
  data fetching, analytics, and performance standards.

## Tech Stack

- **Backend:** Python 3.12, Django, Django REST Framework, PostgreSQL,
  django-parler, django-unfold, drf-spectacular, uv.
- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS,
  shadcn-style UI primitives, TanStack Query, Zustand, Formik, Zod, Axios.
- **Payments:** LiqPay sandbox.
- **Quality:** Vitest, Testing Library, MSW, Playwright, ESLint, Ruff, Black,
  mypy, pre-commit, GitHub Actions.

## Project Structure

```text
backend/          Django API, admin, payments, backend docs
frontend/         Next.js app, UI, tests, frontend docs
scripts/          Local development helpers
Makefile          Shared development commands
```

## Main Features

| Area | What is included |
| --- | --- |
| Catalog | localized products, tags, search, sorting, pagination, responsive cards |
| Product | detail page, image fallback, cart actions, analytics view tracking |
| Cart | persisted cart, quantity controls, removal confirmations, order totals |
| Checkout | delivery form, draft persistence, payment method selection, order submit |
| Auth | sign-in/sign-up pages, profile guard, token refresh boundary |
| Admin | Unfold-powered Django admin for store management |
| Analytics | ecommerce funnel events without customer PII |
| Quality | unit, coverage, e2e, a11y, visual regression, lint, typecheck, build |

## Backend Notifications

Bloomify does not use Celery or a durable worker queue. Backend order and Sentry
events call `publish_telegram_notification()`, which posts a signed payload to
`NOTIFICATION_PUBLISHER_WEBHOOK_URL` when that webhook is configured. If the
webhook is not configured, Django sends the Telegram message synchronously as a
lightweight fallback.

## Quick Start

Create local env files:

```bash
cp backend/.env.sample backend/.env
cp frontend/.env.sample frontend/.env
```

Install dependencies and apply migrations:

```bash
make install
make frontend-install
make migrate
```

Run the app:

```bash
make run
make start
```

Local URLs:

- Frontend: `http://localhost:3000`
- API: `http://127.0.0.1:8000/`
- Admin: `http://127.0.0.1:8000/admin/`
- API docs: `http://127.0.0.1:8000/docs/`

## Vercel Services Deployment

Bloomify is configured for a single Vercel project with two services:

| Service | Entrypoint | Route |
| --- | --- | --- |
| Frontend | `frontend` | `/` |
| Backend | `backend` | `/api` |

The root [vercel.json](vercel.json) uses Vercel Services. In the Vercel
dashboard, set the project framework preset to **Services** before deploying.

Production environment values:

```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_MEDIA_HOST=/api
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ANALYTICS_PROVIDER=vercel

DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=.vercel.app,bloomify-pi.vercel.app
DJANGO_CORS_ALLOWED_ORIGINS=https://bloomify-pi.vercel.app
DJANGO_CSRF_TRUSTED_ORIGINS=https://*.vercel.app,https://bloomify-pi.vercel.app
DJANGO_FORCE_SCRIPT_NAME=/api
ADMIN_SITE_URL=https://bloomify-pi.vercel.app
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
POSTGRES_SSLMODE=require
```

Django still needs a production database and secrets configured in Vercel
environment variables. Media files should use durable external storage for real
production usage; local filesystem media is only suitable for demos and local
development.

## Quality Checks

Backend:

```bash
make format
make lint
cd backend && uv run python manage.py test shop.tests
```

Frontend:

```bash
make frontend-lint
make frontend-typecheck
make frontend-test-unit
make frontend-test-e2e
make frontend-build
```

Use `make pre-commit` before preparing a commit.

## Analytics

Bloomify tracks the primary ecommerce funnel through a frontend analytics layer:

```text
view_item_list -> select_item -> view_item -> add_to_cart -> view_cart -> begin_checkout -> checkout_submit -> purchase
```

Analytics is disabled locally by default and enabled in production through env
configuration. Customer email, phone, name, address, tokens, raw payment data,
and raw search text must never be sent to analytics.

Details: [frontend analytics docs](frontend/docs/analytics.md).

## Documentation

- [Backend README](backend/README.md)
- [Backend docs](backend/docs/README.md)
- [Frontend README](frontend/README.md)
- [Frontend docs](frontend/docs/README.md)
- [Frontend design system](frontend/docs/design-system.md)
- [Frontend testing guide](frontend/docs/testing.md)
- [Frontend performance guide](frontend/docs/performance.md)
- [Frontend analytics guide](frontend/docs/analytics.md)

## Notes

- Use the root `Makefile` as the source of truth for common commands.
- Keep environment-specific URLs and service settings in `.env` files.
- Keep feature work inside the owning backend app or frontend domain unless
  shared behavior requires coordination.
