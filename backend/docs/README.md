# Bloomify Backend Docs

This folder describes target backend standards for Bloomify. Treat these documents as the reference for new Django work and refactoring. Existing code may not fully match the target yet; when touching an area, move it toward these rules without broad unrelated rewrites.

## Docs Map

- [Testing](./testing.md) - Django tests, factories, fixtures, API tests, payment callbacks, load testing, and verification commands.
- [Validation Strategy](./VALIDATION_STRATEGY.md) - 4-layer validation approach: frontend Zod, DRF serializers, service business logic, and payment verification.
- [Admin](./ADMIN_PANEL_README.md) - Unfold admin structure, registration rules, styling boundaries, and maintenance conventions.
- [Subscription Launch Checklist](./SUBSCRIPTION_LAUNCH_CHECKLIST.md) - Pre-launch testing, daily monitoring queries, and post-launch investigation procedures.
- [Subscription Post-Launch Audit](./SUBSCRIPTION_POST_LAUNCH_AUDIT.md) - Daily/weekly audit tools, investigation scenarios, escalation procedures, and runbook commands.

## Default Workflow

Before changing backend code:

1. Read this index.
2. Read only the document relevant to the task.
3. Inspect the current app implementation.
4. Make the smallest change that follows the app's existing Django patterns.
5. Run the relevant checks from the repository root.

```bash
make lint
cd backend && uv run python manage.py test shop.tests
```

Use `make makemigrations` for model changes and verify migrations with:

```bash
cd backend && uv run python manage.py makemigrations --check --dry-run
```
