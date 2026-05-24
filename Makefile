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


# ---------- Docker services ----------

services-up:
	$(DOCKER_COMPOSE) up -d postgres redis

services-down:
	$(DOCKER_COMPOSE) down

services-logs:
	$(DOCKER_COMPOSE) logs -f postgres redis

postgres-up:
	$(DOCKER_COMPOSE) up -d postgres

redis-up:
	$(DOCKER_COMPOSE) up -d redis

redis-ping:
	docker exec -it bloomify_redis redis-cli ping


# ---------- Backend ----------

install:
	cd $(BACKEND_DIR) && uv sync

upgrade:
	cd $(BACKEND_DIR) && uv sync --upgrade

run:
	cd $(BACKEND_DIR) && uv run python manage.py runserver

backend-run: services-up
	cd $(BACKEND_DIR) && uv run python manage.py runserver

celery:
	cd $(BACKEND_DIR) && uv run celery -A config.celery worker -l info

dev: services-up
	@echo "Starting Django and Celery..."
	cd $(BACKEND_DIR) && \
	trap 'kill 0' INT TERM EXIT; \
	uv run celery -A config.celery worker -l info & \
	uv run python manage.py runserver
	
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
	cd $(BACKEND_DIR) && uv run ruff check .
	cd $(BACKEND_DIR) && uv run mypy .

check: format lint


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
