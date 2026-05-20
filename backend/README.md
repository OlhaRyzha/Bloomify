# Bloomify Backend

Use this file as the backend entry point. Project-level commands live in the root `Makefile`.

## Docs

- [Backend Docs](./docs/README.md)
- [Backend Testing](./docs/testing.md)

## Common Commands

Run from the repository root:

```bash
make install
make run
make migrate
make lint
```

Run backend tests:

```bash
cd backend && uv run python manage.py test shop.tests
```
