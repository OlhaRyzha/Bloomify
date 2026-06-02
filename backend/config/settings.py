import os
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = os.environ.get("DJANGO_ENV_FILE", ".env")


class EnvironmentSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DJANGO_DEBUG: bool
    DJANGO_SECRET_KEY: str
    DJANGO_ALLOWED_HOSTS: str
    DJANGO_CORS_ALLOWED_ORIGINS: str
    DJANGO_CSRF_TRUSTED_ORIGINS: str = ""
    DJANGO_FORCE_SCRIPT_NAME: str = ""
    DJANGO_MEDIA_URL: str = ""
    DJANGO_SECURE_SSL_REDIRECT: bool = False
    DJANGO_SESSION_COOKIE_SECURE: bool = False
    DJANGO_CSRF_COOKIE_SECURE: bool = False
    DJANGO_SECURE_HSTS_SECONDS: int = 0
    DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS: bool = False
    DJANGO_SECURE_HSTS_PRELOAD: bool = False
    DJANGO_ENABLE_API_DOCS: bool = True
    ADMIN_SITE_URL: str = "http://localhost:3000"

    DATABASE_URL: str = ""
    POSTGRES_URL: str = ""
    POSTGRES_HOST: str = ""
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = ""
    POSTGRES_DATABASE: str = ""
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_SSLMODE: str = ""

    REDIS_PORT: int = 6379
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    CELERY_TASK_ALWAYS_EAGER: bool = False
    CELERY_TASK_EAGER_PROPAGATES: bool = False

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


def parse_postgres_port(port: str) -> int:
    try:
        return int(port)
    except ValueError:
        return 5432


def build_database_config() -> dict[str, object]:
    database_url = env.DATABASE_URL or env.POSTGRES_URL
    postgres_port = parse_postgres_port(env.POSTGRES_PORT)
    if database_url:
        parsed_url = urlparse(database_url)
        query_params = parse_qs(parsed_url.query)
        sslmode = query_params.get("sslmode", [env.POSTGRES_SSLMODE])[0]
        database_options = {"sslmode": sslmode} if sslmode else {}

        config: dict[str, object] = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed_url.path.lstrip("/"),
            "USER": unquote(parsed_url.username or ""),
            "PASSWORD": unquote(parsed_url.password or ""),
            "HOST": parsed_url.hostname or "",
            "PORT": parsed_url.port or postgres_port,
        }
        if database_options:
            config["OPTIONS"] = database_options
        return config

    config = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env.POSTGRES_DB or env.POSTGRES_DATABASE,
        "USER": env.POSTGRES_USER,
        "PASSWORD": env.POSTGRES_PASSWORD,
        "HOST": env.POSTGRES_HOST,
        "PORT": postgres_port,
    }
    if env.POSTGRES_SSLMODE:
        config["OPTIONS"] = {"sslmode": env.POSTGRES_SSLMODE}
    return config


SECRET_KEY = env.DJANGO_SECRET_KEY
JWT_SECRET_KEY = SECRET_KEY
JWT_ALGORITHM = "HS256"

DEBUG = env.DJANGO_DEBUG

ALLOWED_HOSTS = [
    item.strip() for item in env.DJANGO_ALLOWED_HOSTS.split(",") if item.strip()
]

DOCS_PATH: str | None = "docs/" if env.DJANGO_ENABLE_API_DOCS else None
REDOC_PATH: str | None = "redoc/" if env.DJANGO_ENABLE_API_DOCS else None
SCHEMA_PATH: str | None = "schema/" if env.DJANGO_ENABLE_API_DOCS else None

CORS_ALLOWED_ORIGINS = [
    item.strip() for item in env.DJANGO_CORS_ALLOWED_ORIGINS.split(",") if item.strip()
]
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    item.strip() for item in env.DJANGO_CSRF_TRUSTED_ORIGINS.split(",") if item.strip()
]

SECURE_SSL_REDIRECT = env.DJANGO_SECURE_SSL_REDIRECT
SESSION_COOKIE_SECURE = env.DJANGO_SESSION_COOKIE_SECURE
CSRF_COOKIE_SECURE = env.DJANGO_CSRF_COOKIE_SECURE
SECURE_HSTS_SECONDS = env.DJANGO_SECURE_HSTS_SECONDS
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS
SECURE_HSTS_PRELOAD = env.DJANGO_SECURE_HSTS_PRELOAD

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

FORCE_SCRIPT_NAME = (
    env.DJANGO_FORCE_SCRIPT_NAME.rstrip("/") if env.DJANGO_FORCE_SCRIPT_NAME else None
)
STATIC_BASE_PATH = f"{FORCE_SCRIPT_NAME or ''}/static"
ADMIN_BASE_PATH = f"{FORCE_SCRIPT_NAME or ''}/admin"

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
    "SITE_TITLE": "Bloomify admin panel",
    "SITE_HEADER": "Bloomify",
    "SITE_SUBHEADER": "Flower shop - subscriptions - orders",
    "SHOW_LANGUAGES": True,
    "LANGUAGE_FLAGS": {
        "uk": "🇺🇦",
        "en": "🇬🇧",
        "pl": "🇵🇱",
    },
    "SITE_URL": env.ADMIN_SITE_URL,
    "SITE_ICON": {
        "light": f"{STATIC_BASE_PATH}/bloomify/admin-icon.svg",
        "dark": f"{STATIC_BASE_PATH}/bloomify/admin-icon.svg",
    },
    "SITE_LOGO": {
        "light": f"{STATIC_BASE_PATH}/bloomify/admin-logo.svg",
        "dark": f"{STATIC_BASE_PATH}/bloomify/admin-logo.svg",
    },
    "SITE_FAVICONS": [
        {
            "rel": "icon",
            "sizes": "32x32",
            "type": "image/png",
            "href": f"{STATIC_BASE_PATH}/bloomify/favicon-32.png",
        },
    ],
    "STYLES": [f"{STATIC_BASE_PATH}/bloomify/admin.css"],
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
    "SCRIPTS": [f"{STATIC_BASE_PATH}/bloomify/admin.js"],
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Store",
                "items": [
                    {
                        "title": "Bouquets",
                        "icon": "local_florist",
                        "link": f"{ADMIN_BASE_PATH}/shop/product/",
                    },
                    {
                        "title": "Orders",
                        "icon": "receipt_long",
                        "link": f"{ADMIN_BASE_PATH}/shop/order/",
                    },
                    {
                        "title": "Subscription plans",
                        "icon": "workspace_premium",
                        "link": f"{ADMIN_BASE_PATH}/shop/subscriptionplan/",
                    },
                    {
                        "title": "Subscriptions",
                        "icon": "autorenew",
                        "link": f"{ADMIN_BASE_PATH}/shop/subscription/",
                    },
                    {
                        "title": "Website languages",
                        "icon": "language",
                        "link": f"{ADMIN_BASE_PATH}/shop/sitelanguagesettings/",
                    },
                ],
            },
            {
                "title": "Users",
                "items": [
                    {
                        "title": "Users",
                        "icon": "group",
                        "link": f"{ADMIN_BASE_PATH}/auth/user/",
                    },
                    {
                        "title": "Roles",
                        "icon": "admin_panel_settings",
                        "link": f"{ADMIN_BASE_PATH}/auth/group/",
                    },
                ],
            },
        ],
    },
}


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
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


DATABASES = {"default": build_database_config()}


CELERY_BROKER_URL = env.CELERY_BROKER_URL
CELERY_RESULT_BACKEND = env.CELERY_RESULT_BACKEND
CELERY_TASK_ALWAYS_EAGER = env.CELERY_TASK_ALWAYS_EAGER
CELERY_TASK_EAGER_PROPAGATES = env.CELERY_TASK_EAGER_PROPAGATES


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
    ("uk", "Ukrainian"),
    ("en", "English"),
    ("pl", "Polish"),
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


STATIC_URL = f"{FORCE_SCRIPT_NAME}/static/" if FORCE_SCRIPT_NAME else "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = env.DJANGO_MEDIA_URL or (
    f"{FORCE_SCRIPT_NAME}/media/" if FORCE_SCRIPT_NAME else "/media/"
)

MEDIA_ROOT = BASE_DIR / "media"

CRISPY_ALLOWED_TEMPLATE_PACKS = ("unfold",)
CRISPY_TEMPLATE_PACK = "unfold"

LIQPAY_PUBLIC_KEY = env.LIQPAY_PUBLIC_KEY
LIQPAY_PRIVATE_KEY = env.LIQPAY_PRIVATE_KEY
LIQPAY_CHECKOUT_URL = env.LIQPAY_CHECKOUT_URL
LIQPAY_SERVER_URL = env.LIQPAY_SERVER_URL
LIQPAY_RESULT_URL = env.LIQPAY_RESULT_URL
