# Bloomify

Bloomify is a flower shop web application with a Django REST backend and a
Next.js frontend. The project covers the core ecommerce flow: browse bouquets,
manage cart and favorites, place checkout orders, and start a LiqPay payment
flow in sandbox mode.

## Features

- Product catalog with localized content, product cards, images, categories,
  favorites, and cart actions.
- Checkout flow with delivery details, persisted draft data, order summary, and
  payment method selection.
- LiqPay sandbox integration for card, Apple Pay, and Google Pay checkout
  flows, plus cash-on-delivery support in the UI.
- Auth-ready frontend with sign-in/sign-up pages, safe post-auth redirects,
  protected profile route handling, in-memory access token storage, and
  refresh-on-401 API behavior.
- Multilingual frontend and backend setup for Ukrainian, English, and Polish.
- Django admin powered by Unfold for managing store data and admin workflows.
- API documentation through drf-spectacular (`/docs/`, `/redoc/`,
  `/schema/`).
- Frontend quality setup with Vitest, Testing Library, MSW, Playwright, ESLint,
  TypeScript, and documented testing conventions.
- Backend quality setup with Django tests, factories/fixtures guidance, Ruff,
  Black, mypy, and documented admin conventions.

## Tech Stack

- Backend: Python 3.12, Django, Django REST Framework, PostgreSQL, django-parler,
  django-unfold, drf-spectacular, uv.
- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style UI
  primitives, TanStack Query, Zustand, Formik, Zod, Axios.
- Payments: LiqPay sandbox checkout.
- Tooling: Makefile, Vitest, MSW, Playwright, Ruff, Black, mypy, pre-commit.

## Project Structure

```text
backend/          Django project, API, admin, payment integration
frontend/         Next.js application and frontend tests
scripts/          Local development helpers
Makefile          Shared project commands
```

Useful docs:

- [Backend README](backend/README.md)
- [Backend docs](backend/docs/README.md)
- [Frontend README](frontend/README.md)
- [Frontend docs](frontend/docs/README.md)
- [Frontend design system](frontend/docs/design-system.md)
- [Frontend auth architecture](frontend/docs/auth.md)
- [Frontend testing guide](frontend/docs/testing.md)

## Prerequisites

- Python 3.12
- uv
- Node.js and npm
- PostgreSQL
- cloudflared, only for LiqPay sandbox tunneling

## Environment Setup

Create local environment files from the samples:

```bash
cp backend/.env.sample backend/.env
cp frontend/.env.sample frontend/.env
```

Minimum local backend values:

```env
DJANGO_DEBUG=1
DJANGO_SECRET_KEY=your-local-secret
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ADMIN_SITE_URL=http://localhost:3000

POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

Minimum local frontend values:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MEDIA_HOST=http://localhost:8000
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
```

LiqPay values are optional for browsing the catalog, but required for the hosted
payment flow. Use sandbox keys in local development.

## Install

Install backend dependencies:

```bash
make install
```

Install frontend dependencies:

```bash
make frontend-install
```

Apply backend migrations:

```bash
make migrate
```

Create an admin user when needed:

```bash
make createsuperuser
```

## Run Locally

Start the backend API:

```bash
make run
```

Backend URLs:

- API: `http://127.0.0.1:8000/`
- Admin: `http://127.0.0.1:8000/admin/`
- Swagger: `http://127.0.0.1:8000/docs/`
- Redoc: `http://127.0.0.1:8000/redoc/`

Start the frontend in a second terminal:

```bash
make start
```

Frontend URL:

- `http://localhost:3000`

## LiqPay Sandbox Flow

LiqPay needs public HTTPS callback/result URLs. The project includes a helper
that starts backend, frontend, two Cloudflare tunnels, and writes the current
tunnel URLs into `backend/.env` and `frontend/.env`.

```bash
make liqpay-dev
```

Manual tunnel commands are also available:

```bash
make tunnel-backend
make tunnel-frontend
```

For LiqPay setup details, keep the URLs in env files instead of hardcoding them
in source code.

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

Full frontend unit coverage:

```bash
make frontend-test-coverage
```

Pre-commit:

```bash
make pre-commit-install
make pre-commit
```

## Development Conventions

- Use the root `Makefile` as the source of truth for common commands.
- Keep backend code inside the owning Django app unless shared behavior requires
  a common module.
- Keep frontend feature code inside the owning domain under `frontend/src`.
- Prefer direct imports over proxy re-export files.
- Do not add placeholder Python `__init__.py` files unless package discovery or
  framework tooling requires them.
- Keep URLs and environment-specific values in `.env` files, not in source code.
- For frontend work, start with `frontend/docs/README.md` and then read the
  specific relevant guide.

