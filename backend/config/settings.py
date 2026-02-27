from pathlib import Path

from django.utils.translation import gettext_lazy as _
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class EnvironmentSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
    )

    DJANGO_DEBUG: bool
    DJANGO_SECRET_KEY: str
    DJANGO_ALLOWED_HOSTS: str
    DJANGO_CORS_ALLOWED_ORIGINS: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str


env = EnvironmentSettings.model_validate({})

SECRET_KEY = env.DJANGO_SECRET_KEY

DEBUG = env.DJANGO_DEBUG

ALLOWED_HOSTS = [
    item.strip() for item in env.DJANGO_ALLOWED_HOSTS.split(",") if item.strip()
]

DOCS_PATH: str | None = None

CORS_ALLOWED_ORIGINS = [
    item.strip() for item in env.DJANGO_CORS_ALLOWED_ORIGINS.split(",") if item.strip()
]
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True


INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "unfold.contrib.inlines",
    "unfold.contrib.import_export",
    "unfold.contrib.simple_history",
    "crispy_forms",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "rest_framework",
    "corsheaders",
    "shop.apps.ShopConfig",
    "django.contrib.staticfiles",
]

UNFOLD = {
    "SITE_TITLE": _("Bloomify admin panel"),
    "SITE_HEADER": "Bloomify",
    "SITE_SUBHEADER": _("Flower shop • subscriptions • orders"),
    "SHOW_LANGUAGES": True,
    "LANGUAGE_FLAGS": {
        "uk": "🇺🇦",
        "en": "🇬🇧",
        "pl": "🇵🇱",
    },
    "SITE_URL": "http://localhost:3000",
    "SITE_ICON": {
        "light": "/static/bloomify/admin-icon.svg",
        "dark": "/static/bloomify/admin-icon.svg",
    },
    "SITE_LOGO": {
        "light": "/static/bloomify/admin-logo.svg",
        "dark": "/static/bloomify/admin-logo.svg",
    },
    "FAVICONS": [
        {
            "rel": "icon",
            "sizes": "32x32",
            "type": "image/png",
            "href": "/static/bloomify/favicon-32.png",
        },
    ],
    "STYLES": ["/static/bloomify/admin.css"],
    "COLORS": {
        "primary": {
            "50": "252 243 244",
            "100": "247 227 229",
            "200": "242 207 211",
            "300": "233 175 181",
            "400": "224 144 152",
            "500": "216 119 129",
            "600": "203 72 86",
            "700": "175 49 62",
            "800": "135 38 48",
            "900": "95 27 34",
            "950": "56 16 20",
        },
    },
    "SCRIPTS": [],
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": lambda request: _("Store"),
                "items": [
                    {
                        "title": lambda request: _("Bouquets"),
                        "icon": "local_florist",
                        "link": "/admin/shop/product/",
                    },
                    {
                        "title": lambda request: _("Orders"),
                        "icon": "receipt_long",
                        "link": "/admin/shop/order/",
                    },
                    {
                        "title": lambda request: _("Subscription plans"),
                        "icon": "workspace_premium",
                        "link": "/admin/shop/subscriptionplan/",
                    },
                    {
                        "title": lambda request: _("Subscriptions"),
                        "icon": "autorenew",
                        "link": "/admin/shop/subscription/",
                    },
                ],
            },
            {
                "title": lambda request: _("Users"),
                "items": [
                    {
                        "title": lambda request: _("Users"),
                        "icon": "group",
                        "link": "/admin/auth/user/",
                    },
                ],
            },
        ],
    },
}


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env.POSTGRES_DB,
        "USER": env.POSTGRES_USER,
        "PASSWORD": env.POSTGRES_PASSWORD,
        "HOST": env.POSTGRES_HOST,
        "PORT": env.POSTGRES_PORT,
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}


LANGUAGE_CODE = "uk"

LANGUAGES = [
    ("uk", _("Ukrainian")),
    ("en", _("English")),
    ("pl", _("Polish")),
]

LOCALE_PATHS = [BASE_DIR / "locale"]

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]


MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

CRISPY_ALLOWED_TEMPLATE_PACKS = ("unfold",)
CRISPY_TEMPLATE_PACK = "unfold"
