BACKEND_DIR=backend
FRONTEND_DIR=frontend
BACKEND_PORT=8000
FRONTEND_PORT=3000
DOCKER_COMPOSE=docker-compose --env-file $(BACKEND_DIR)/.env -f $(BACKEND_DIR)/docker-compose.yml

# ---------- Frontend ----------

frontend-install:
	cd $(FRONTEND_DIR) && npm install

frontend-ci-install:
	cd $(FRONTEND_DIR) && npm ci

start:
	cd $(FRONTEND_DIR) && npm run dev

liqpay-dev:
	python3 scripts/liqpay_dev.py

tunnel-backend:
	cloudflared tunnel --url http://localhost:$(BACKEND_PORT)

tunnel-frontend:
	cloudflared tunnel --url http://localhost:$(FRONTEND_PORT)

frontend-build:
	cd $(FRONTEND_DIR) && npm run build

frontend-lint:
	cd $(FRONTEND_DIR) && npm run lint

frontend-typecheck:
	cd $(FRONTEND_DIR) && npm run typecheck

frontend-test:
	cd $(FRONTEND_DIR) && npm run test

frontend-test-all:
	cd $(FRONTEND_DIR) && npm run test:all

frontend-test-unit:
	cd $(FRONTEND_DIR) && npm run test:unit

frontend-test-watch:
	cd $(FRONTEND_DIR) && npm run test:unit:watch

frontend-test-ui:
	cd $(FRONTEND_DIR) && npm run test:unit:ui

frontend-test-coverage:
	cd $(FRONTEND_DIR) && npm run test:coverage

frontend-test-e2e:
	cd $(FRONTEND_DIR) && npm run test:e2e

frontend-test-e2e-a11y:
	cd $(FRONTEND_DIR) && npm run test:e2e:a11y

frontend-test-e2e-visual:
	cd $(FRONTEND_DIR) && npm run test:e2e:visual

frontend-performance-budget:
	cd $(FRONTEND_DIR) && npm run build && npm run performance:budget

frontend-check-deps:
	cd $(FRONTEND_DIR) && npx depcheck

generate-api-types:
	cd $(BACKEND_DIR) && uv run python manage.py spectacular --file ../openapi.json
	cd $(FRONTEND_DIR) && npx openapi-typescript ../openapi.json -o src/types/api.generated.ts
	rm -f openapi.json

frontend-check-unimported:
	cd $(FRONTEND_DIR) && npx unimported

frontend-check-unused:
	cd $(FRONTEND_DIR) && npx ts-prune

# ---------- Docker services ----------

services-up:
	$(DOCKER_COMPOSE) up -d postgres

services-down:
	$(DOCKER_COMPOSE) down

services-logs:
	$(DOCKER_COMPOSE) logs -f postgres

postgres-up:
	$(DOCKER_COMPOSE) up -d postgres


# ---------- Backend ----------

install:
	cd $(BACKEND_DIR) && uv sync

upgrade:
	cd $(BACKEND_DIR) && uv sync --upgrade

run:
	cd $(BACKEND_DIR) && uv run python manage.py runserver

backend-run: services-up
	cd $(BACKEND_DIR) && uv run python manage.py runserver

dev: services-up
	cd $(BACKEND_DIR) && uv run python manage.py runserver
	
migrate:
	cd $(BACKEND_DIR) && uv run python manage.py migrate

makemigrations:
	cd $(BACKEND_DIR) && uv run python manage.py makemigrations

createsuperuser:
	cd $(BACKEND_DIR) && uv run python manage.py createsuperuser

format:
	cd $(BACKEND_DIR) && uv run ruff check . --fix
	cd $(BACKEND_DIR) && uv run black .

lint:
	$(MAKE) no-any
	cd $(BACKEND_DIR) && uv run ruff check .
	cd $(BACKEND_DIR) && uv run mypy .
	$(MAKE) backend-pyright

check: format lint

no-any:
	! rg -n '\bAny\b|from typing import .*Any' $(BACKEND_DIR) --glob '*.py'
	! rg -n 'dict\[str, object\]|Mapping\[str, object\]|dict\[str, str \| bool\]|list\[dict\[str, int\]\]' $(BACKEND_DIR) --glob '*.py' --glob '!backend/shop/types.py'
	! rg -n '\bany\b' $(FRONTEND_DIR)/src --glob '*.ts' --glob '*.tsx'

backend-pyright:
	cd $(FRONTEND_DIR) && npx pyright --project ../pyrightconfig.json


# ---------- pre-commit ----------

pre-commit-install:
	cd $(BACKEND_DIR) && uv run pre-commit install
	cd $(BACKEND_DIR) && uv run pre-commit install --hook-type pre-push

pre-commit:
	cd $(BACKEND_DIR) && uv run pre-commit run --all-files

clean:
	rm -rf $(BACKEND_DIR)/.mypy_cache
	rm -rf $(BACKEND_DIR)/.ruff_cache
	rm -rf .pre-commit-cache
