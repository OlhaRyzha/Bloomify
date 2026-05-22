# Backend Admin

Bloomify uses Django Admin with Unfold for internal store operations. Keep admin
code boring, explicit, and close to the model it configures.

## File Ownership

- Global Unfold configuration lives in `backend/config/settings.py` under
  `UNFOLD`.
- Admin model registration lives under `backend/shop/admin`.
- Admin-only CSS, JS, icons, and logos live under `backend/static/bloomify`.
- Admin template overrides live under `backend/templates/unfold`.

Do not put model admin configuration in models, serializers, views, or settings.
Settings should only wire global Unfold behavior and static assets.

## Registration Pattern

Use one file per admin domain:

- `products.py` for bouquet/product admin.
- `orders.py` for order and order item admin.
- `subscriptions.py` for subscription plans and subscriptions.
- `site_languages.py` for singleton language settings.
- `users.py` for auth user admin customization.

Each model admin should register its model in the owning module with
`@admin.register(Model)`. The `shop/admin/__init__.py` file intentionally imports
those modules so Django admin autodiscovery executes the registrations. Do not
use it as a public re-export surface for unrelated code.

## Unfold Settings

The `UNFOLD` block should stay limited to global admin shell behavior:

- Site title, header, subheader, and frontend URL.
- Logo, icon, favicon, CSS, and JS static asset paths.
- Sidebar navigation groups.
- Global color tokens.

Project URLs must come from environment settings. For example, `SITE_URL` uses
`ADMIN_SITE_URL`, not a hardcoded localhost URL.

## Static And Template Overrides

Use `backend/static/bloomify/admin.css` for admin styling and
`backend/static/bloomify/admin.js` for admin behavior that cannot be expressed
through ModelAdmin options.

Use template overrides only when Unfold does not expose a setting or ModelAdmin
option for the customization. Keep overrides narrow and document why they exist
near the template file or in this document.

Current template override:

- `templates/unfold/helpers/navigation_user.html` customizes the user navigation
  area.

## ModelAdmin Rules

- Prefer direct imports from model modules, such as
  `shop.models.product.Product`, instead of importing through `shop.models`.
- Keep `list_display`, `list_filter`, `search_fields`, `fieldsets`,
  `readonly_fields`, and `autocomplete_fields` explicit.
- Put display helpers on the relevant ModelAdmin and decorate them with
  `@admin.display`.
- Keep HTML snippets small and generated with `format_html`.
- Do not perform external API calls from admin display methods.
- Do not hide business logic in admin classes. Move reusable behavior to
  services/selectors/models and call it from admin only when needed.

## Package Files And Proxy Imports

Avoid empty or proxy `__init__.py` files. Add `__init__.py` only when it is needed
for package discovery or framework behavior.

Allowed current exceptions:

- `shop/__init__.py` marks the Django app package.
- `shop/migrations/__init__.py` marks the migrations package.
- `config/__init__.py` marks the Django project package used by
  `DJANGO_SETTINGS_MODULE`.
- `shop/tests/__init__.py` keeps `manage.py test shop.tests` compatible with
  Django's unittest discovery.
- `shop/models/__init__.py` imports concrete model classes because Django loads
  `shop.models` during app discovery when models are organized as a package.
- `shop/admin/__init__.py` imports admin modules so Django admin autodiscovery
  runs registrations.

Do not import application code through proxy packages just because they exist.
Prefer direct module imports.

## Type Annotation Imports

Do not add `from __future__ import annotations` to new Python files. The project
runs on modern Python, so use normal annotations and explicit imports. If a
typing-only dependency would create a runtime cycle, use local imports or
`typing.TYPE_CHECKING` narrowly.
