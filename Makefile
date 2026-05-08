
BACKEND_DIR=backend
FRONTEND_DIR=frontend

# ---------- Frontend ----------

frontend-install:
	cd $(FRONTEND_DIR) && npm install

frontend-ci-install:
	cd $(FRONTEND_DIR) && npm ci

start:
	cd $(FRONTEND_DIR) && npm run dev

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


# ---------- Backend ----------

install:
	cd $(BACKEND_DIR) && uv sync

upgrade:
	cd $(BACKEND_DIR) && uv sync --upgrade

run:
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
	cd $(BACKEND_DIR) && uv run ruff check .
	cd $(BACKEND_DIR) && uv run mypy .


check: format lint

# ---------- pre-commit ----------

pre-commit-install:
	uv run pre-commit install


pre-commit:
	uv run pre-commit run --all-files


clean:
	rm -rf $(BACKEND_DIR)/.mypy_cache
	rm -rf $(BACKEND_DIR)/.ruff_cache
	rm -rf .pre-commit-cache
