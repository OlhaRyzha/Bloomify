import os
from pathlib import Path

from django.utils.translation import gettext_lazy as _
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = Path(os.getenv("DJANGO_ENV_FILE", BASE_DIR / ".env"))
if not ENV_FILE.is_absolute():
    ENV_FILE = BASE_DIR / ENV_FILE


class EnvironmentSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DJANGO_DEBUG: bool
    DJANGO_SECRET_KEY: str
    DJANGO_ALLOWED_HOSTS: str
    DJANGO_CORS_ALLOWED_ORIGINS: str
    DJANGO_SECURE_SSL_REDIRECT: bool | None = None
    DJANGO_SESSION_COOKIE_SECURE: bool | None = None
    DJANGO_CSRF_COOKIE_SECURE: bool | None = None
    DJANGO_SECURE_HSTS_SECONDS: int = 0
    DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS: bool = False
    DJANGO_SECURE_HSTS_PRELOAD: bool = False
    DJANGO_ENABLE_API_DOCS: bool | None = None
    ADMIN_SITE_URL: str = "http://localhost:3000"

    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str

    REDIS_PORT: int = 6379
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_ADMIN_CHAT_ID: str = ""

    LIQPAY_DEV_BACKEND_LOCAL_URL: str = ""
    LIQPAY_CALLBACK_PATH: str = "/payments/liqpay/callback"
    LIQPAY_RESULT_PATH: str = "/checkout"
    LIQPAY_PUBLIC_KEY: str = ""
    LIQPAY_PRIVATE_KEY: str = ""
    LIQPAY_CHECKOUT_URL: str = "https://www.liqpay.ua/api/3/checkout"
    LIQPAY_SERVER_URL: str = ""
    LIQPAY_RESULT_URL: str = "http://localhost:3000/checkout"


env = EnvironmentSettings.model_validate({})

SECRET_KEY = env.DJANGO_SECRET_KEY
JWT_SECRET_KEY = SECRET_KEY
JWT_ALGORITHM = "HS256"

DEBUG = env.DJANGO_DEBUG

ALLOWED_HOSTS = [
    item.strip() for item in env.DJANGO_ALLOWED_HOSTS.split(",") if item.strip()
]

ENABLE_API_DOCS = (
    env.DJANGO_ENABLE_API_DOCS if env.DJANGO_ENABLE_API_DOCS is not None else DEBUG
)
DOCS_PATH: str | None = "docs/" if ENABLE_API_DOCS else None
REDOC_PATH: str | None = "redoc/" if ENABLE_API_DOCS else None
SCHEMA_PATH: str | None = "schema/" if ENABLE_API_DOCS else None

CORS_ALLOWED_ORIGINS = [
    item.strip() for item in env.DJANGO_CORS_ALLOWED_ORIGINS.split(",") if item.strip()
]
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = (
    env.DJANGO_SECURE_SSL_REDIRECT
    if env.DJANGO_SECURE_SSL_REDIRECT is not None
    else not DEBUG
)
SESSION_COOKIE_SECURE = (
    env.DJANGO_SESSION_COOKIE_SECURE
    if env.DJANGO_SESSION_COOKIE_SECURE is not None
    else not DEBUG
)
CSRF_COOKIE_SECURE = (
    env.DJANGO_CSRF_COOKIE_SECURE
    if env.DJANGO_CSRF_COOKIE_SECURE is not None
    else not DEBUG
)
SESSION_COOKIE_HTTPONLY = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = env.DJANGO_SECURE_HSTS_SECONDS
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS
SECURE_HSTS_PRELOAD = env.DJANGO_SECURE_HSTS_PRELOAD


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
    "parler",
    "rest_framework",
    "drf_spectacular",
    "corsheaders",
    "shop.apps.ShopConfig",
    # "notifications",
    "notifications.apps.NotificationsConfig",
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
    "SITE_URL": env.ADMIN_SITE_URL,
    "SITE_ICON": {
        "light": "/static/bloomify/admin-icon.svg",
        "dark": "/static/bloomify/admin-icon.svg",
    },
    "SITE_LOGO": {
        "light": "/static/bloomify/admin-logo.svg",
        "dark": "/static/bloomify/admin-logo.svg",
    },
    "SITE_FAVICONS": [
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
    "SCRIPTS": ["/static/bloomify/admin.js"],
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": _("Store"),
                "items": [
                    {
                        "title": _("Bouquets"),
                        "icon": "local_florist",
                        "link": "/admin/shop/product/",
                    },
                    {
                        "title": _("Orders"),
                        "icon": "receipt_long",
                        "link": "/admin/shop/order/",
                    },
                    {
                        "title": _("Subscription plans"),
                        "icon": "workspace_premium",
                        "link": "/admin/shop/subscriptionplan/",
                    },
                    {
                        "title": _("Subscriptions"),
                        "icon": "autorenew",
                        "link": "/admin/shop/subscription/",
                    },
                    {
                        "title": _("Website languages"),
                        "icon": "language",
                        "link": "/admin/shop/sitelanguagesettings/",
                    },
                ],
            },
            {
                "title": _("Users"),
                "items": [
                    {
                        "title": _("Users"),
                        "icon": "group",
                        "link": "/admin/auth/user/",
                    },
                    {
                        "title": _("Roles"),
                        "icon": "admin_panel_settings",
                        "link": "/admin/auth/group/",
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


CELERY_BROKER_URL = env.CELERY_BROKER_URL
CELERY_RESULT_BACKEND = env.CELERY_RESULT_BACKEND

CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "Europe/Kyiv"

TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN
TELEGRAM_ADMIN_CHAT_ID = env.TELEGRAM_ADMIN_CHAT_ID


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
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Bloomify API",
    "DESCRIPTION": "API documentation for Bloomify backend",
    "VERSION": "1.0.0",
}


LANGUAGE_CODE = "uk"

LANGUAGES = [
    ("uk", _("Ukrainian")),
    ("en", _("English")),
    ("pl", _("Polish")),
]

LOCALE_PATHS = [BASE_DIR / "locale"]

PARLER_LANGUAGES = {
    None: (
        {"code": "uk"},
        {"code": "en"},
        {"code": "pl"},
    ),
    "default": {
        "fallbacks": ["uk"],
        "hide_untranslated": False,
    },
}

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]


MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

CRISPY_ALLOWED_TEMPLATE_PACKS = ("unfold",)
CRISPY_TEMPLATE_PACK = "unfold"

LIQPAY_PUBLIC_KEY = env.LIQPAY_PUBLIC_KEY
LIQPAY_PRIVATE_KEY = env.LIQPAY_PRIVATE_KEY
LIQPAY_CHECKOUT_URL = env.LIQPAY_CHECKOUT_URL
LIQPAY_SERVER_URL = env.LIQPAY_SERVER_URL
LIQPAY_RESULT_URL = env.LIQPAY_RESULT_URL
