# Django i18n (Admin + plural forms)

## What is configured

- `LocaleMiddleware` enabled in `MIDDLEWARE`
- `LANGUAGES` configured (`uk`, `en`)
- `LOCALE_PATHS = [BASE_DIR / "locale"]`
- `/i18n/setlang/` route enabled via:
  - `path("i18n/", include("django.conf.urls.i18n"))`
- Admin language switcher added in `templates/admin/base_site.html`

## Best practices for correct plural forms

Use `ngettext` for count-dependent text (English/Ukrainian declensions differ):

```python
from django.utils.translation import ngettext

label = ngettext(
    "%(count)d order",
    "%(count)d orders",
    count,
) % {"count": count}
```

## Translation workflow

```bash
cd backend
uv run django-admin makemessages -a
uv run django-admin compilemessages
```

## Optional plugin

If you need UI editing of translations in admin, use `django-rosetta` (optional).
Core Django i18n is enough for production without extra plugins.
