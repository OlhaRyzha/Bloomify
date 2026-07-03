import logging
import os
from datetime import timedelta as _timedelta
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

import sentry_sdk
from pydantic_settings import BaseSettings
from sentry_sdk.integrations.django import DjangoIntegration

from shop.types import DatabaseConfig

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = os.environ.get("DJANGO_ENV_FILE", ".env")
logger = logging.getLogger(__name__)


class EnvironmentSettings(BaseSettings):
    model_config = {
        "env_file": BASE_DIR / ENV_FILE,
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    DJANGO_DEBUG: bool
    DJANGO_SECRET_KEY: str
    DJANGO_ALLOWED_HOSTS: str
    DJANGO_CORS_ALLOWED_ORIGINS: str
    DJANGO_CORS_ALLOW_ALL_ORIGINS: bool = False
    DJANGO_JWT_SECRET_KEY: str = ""
    DJANGO_CSRF_TRUSTED_ORIGINS: str = ""
    DJANGO_FORCE_SCRIPT_NAME: str = ""
    DJANGO_MEDIA_URL: str = ""
    DJANGO_SECURE_SSL_REDIRECT: bool = False
    DJANGO_SESSION_COOKIE_SECURE: bool = False
    DJANGO_CSRF_COOKIE_SECURE: bool = False
    DJANGO_SECURE_HSTS_SECONDS: int = 0
    DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS: bool = False
    DJANGO_SECURE_HSTS_PRELOAD: bool = False
    DJANGO_ENABLE_API_DOCS: bool = False
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
    POSTGRES_CONNECT_TIMEOUT: int = 10

    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_ADMIN_CHAT_ID: str = ""
    TELEGRAM_CUSTOMER_BOT_TOKEN: str = ""
    TELEGRAM_CUSTOMER_WEBHOOK_SECRET: str = ""
    NOTIFICATION_PUBLISHER_WEBHOOK_URL: str = ""
    NOTIFICATION_PUBLISHER_SECRET: str = ""
    NOTIFICATION_PUBLISHER_TIMEOUT_SECONDS: int = 10
    NOTIFICATION_QUEUE_WEBHOOK_URL: str = ""
    NOTIFICATION_QUEUE_SECRET: str = ""
    NOTIFICATION_QUEUE_TIMEOUT_SECONDS: int = 10

    SENTRY_DSN: str = ""
    SENTRY_ENVIRONMENT: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 0.0
    SENTRY_SEND_DEFAULT_PII: bool = False
    SENTRY_ALERT_WEBHOOK_SECRET: str = ""

    AUTH0_DOMAIN: str = ""
    AUTH0_CLIENT_ID: str = ""
    AUTH0_AUDIENCE: str = ""
    AUTH0_ISSUER: str = ""
    AUTH0_ALGORITHMS: str = "RS256"

    LIQPAY_DEV_BACKEND_LOCAL_URL: str = ""
    LIQPAY_CALLBACK_PATH: str = "/payments/liqpay/callback"
    LIQPAY_RESULT_PATH: str = "/checkout"
    LIQPAY_PUBLIC_KEY: str = ""
    LIQPAY_PRIVATE_KEY: str = ""
    LIQPAY_CHECKOUT_URL: str = "https://www.liqpay.ua/api/3/checkout"
    LIQPAY_API_URL: str = "https://www.liqpay.ua/api/request"
    LIQPAY_SERVER_URL: str = ""
    LIQPAY_RESULT_URL: str = "http://localhost:3000/checkout"
    LIQPAY_SUBSCRIPTION_CALLBACK_PATH: str = "/payments/liqpay/subscription-callback"
    LIQPAY_SUBSCRIPTION_SERVER_URL: str = ""


env = EnvironmentSettings.model_validate({})


def parse_postgres_port(port: str) -> int:
    try:
        return int(port)
    except ValueError:
        return 5432


def parse_postgres_connect_timeout(timeout: str | int) -> int:
    try:
        parsed_timeout = int(timeout)
    except ValueError:
        return 10
    return max(parsed_timeout, 1)


def build_database_config() -> DatabaseConfig:
    database_url = env.DATABASE_URL or env.POSTGRES_URL
    postgres_port = parse_postgres_port(env.POSTGRES_PORT)
    postgres_connect_timeout = parse_postgres_connect_timeout(
        env.POSTGRES_CONNECT_TIMEOUT
    )
    if database_url:
        parsed_url = urlparse(database_url)
        query_params = parse_qs(parsed_url.query)
        sslmode = query_params.get("sslmode", [env.POSTGRES_SSLMODE])[0]
        connect_timeout = query_params.get(
            "connect_timeout", [str(postgres_connect_timeout)]
        )[0]
        url_database_options: DatabaseConfig = {}
        if sslmode:
            url_database_options["sslmode"] = sslmode
        if connect_timeout:
            url_database_options["connect_timeout"] = parse_postgres_connect_timeout(
                connect_timeout
            )

        config: DatabaseConfig = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed_url.path.lstrip("/"),
            "USER": unquote(parsed_url.username or ""),
            "PASSWORD": unquote(parsed_url.password or ""),
            "HOST": parsed_url.hostname or "",
            "PORT": parsed_url.port or postgres_port,
        }
        if url_database_options:
            config["OPTIONS"] = url_database_options
        return config

    config = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env.POSTGRES_DB or env.POSTGRES_DATABASE,
        "USER": env.POSTGRES_USER,
        "PASSWORD": env.POSTGRES_PASSWORD,
        "HOST": env.POSTGRES_HOST,
        "PORT": postgres_port,
    }
    direct_database_options: DatabaseConfig = {}
    if env.POSTGRES_SSLMODE:
        direct_database_options["sslmode"] = env.POSTGRES_SSLMODE
    direct_database_options["connect_timeout"] = postgres_connect_timeout
    if direct_database_options:
        config["OPTIONS"] = direct_database_options
    return config


SECRET_KEY = env.DJANGO_SECRET_KEY
JWT_SECRET_KEY = env.DJANGO_JWT_SECRET_KEY or SECRET_KEY
JWT_ALGORITHM = "HS256"

DEBUG = env.DJANGO_DEBUG


def init_sentry() -> None:
    if not env.SENTRY_DSN or env.SENTRY_DSN.startswith("<"):
        return

    try:
        sentry_sdk.init(
            dsn=env.SENTRY_DSN,
            environment=env.SENTRY_ENVIRONMENT
            or ("development" if DEBUG else "production"),
            integrations=[
                DjangoIntegration(),
            ],
            traces_sample_rate=env.SENTRY_TRACES_SAMPLE_RATE,
            send_default_pii=env.SENTRY_SEND_DEFAULT_PII,
        )
    except Exception as exc:
        logger.warning("Sentry initialization skipped: %s", exc)


init_sentry()

ALLOWED_HOSTS = [
    item.strip() for item in env.DJANGO_ALLOWED_HOSTS.split(",") if item.strip()
]

DOCS_PATH: str | None = "docs/" if env.DJANGO_ENABLE_API_DOCS else None
REDOC_PATH: str | None = "redoc/" if env.DJANGO_ENABLE_API_DOCS else None
SCHEMA_PATH: str | None = "schema/" if env.DJANGO_ENABLE_API_DOCS else None

CORS_ALLOWED_ORIGINS = [
    item.strip() for item in env.DJANGO_CORS_ALLOWED_ORIGINS.split(",") if item.strip()
]
CORS_ALLOW_ALL_ORIGINS = env.DJANGO_CORS_ALLOW_ALL_ORIGINS
CORS_ALLOW_CREDENTIALS = not env.DJANGO_CORS_ALLOW_ALL_ORIGINS
CSRF_TRUSTED_ORIGINS = [
    item.strip() for item in env.DJANGO_CSRF_TRUSTED_ORIGINS.split(",") if item.strip()
]

SECURE_SSL_REDIRECT = env.DJANGO_SECURE_SSL_REDIRECT
SESSION_COOKIE_SECURE = env.DJANGO_SESSION_COOKIE_SECURE
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = env.DJANGO_CSRF_COOKIE_SECURE
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_HSTS_SECONDS = env.DJANGO_SECURE_HSTS_SECONDS
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS
SECURE_HSTS_PRELOAD = env.DJANGO_SECURE_HSTS_PRELOAD
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

FORCE_SCRIPT_NAME = (
    env.DJANGO_FORCE_SCRIPT_NAME.rstrip("/") if env.DJANGO_FORCE_SCRIPT_NAME else None
)
STATIC_BASE_PATH = f"{FORCE_SCRIPT_NAME or ''}/static"
ADMIN_BASE_PATH = f"{FORCE_SCRIPT_NAME or ''}/admin"
ADMIN_ASSET_VERSION = "20260615-tz-inline-2"

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
    "rest_framework_simplejwt.token_blacklist",
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
    "STYLES": [f"{STATIC_BASE_PATH}/bloomify/admin.css?v={ADMIN_ASSET_VERSION}"],
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
    "SCRIPTS": [f"{STATIC_BASE_PATH}/bloomify/admin.js?v={ADMIN_ASSET_VERSION}"],
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
                        "title": "Categories",
                        "icon": "category",
                        "link": f"{ADMIN_BASE_PATH}/shop/category/",
                    },
                    {
                        "title": "Orders",
                        "icon": "receipt_long",
                        "link": f"{ADMIN_BASE_PATH}/shop/order/",
                    },
                    {
                        "title": "Promo codes",
                        "icon": "confirmation_number",
                        "link": f"{ADMIN_BASE_PATH}/shop/promocode/",
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


TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN
TELEGRAM_ADMIN_CHAT_ID = env.TELEGRAM_ADMIN_CHAT_ID
TELEGRAM_CUSTOMER_BOT_TOKEN = env.TELEGRAM_CUSTOMER_BOT_TOKEN
TELEGRAM_CUSTOMER_WEBHOOK_SECRET = env.TELEGRAM_CUSTOMER_WEBHOOK_SECRET
NOTIFICATION_PUBLISHER_WEBHOOK_URL = (
    env.NOTIFICATION_PUBLISHER_WEBHOOK_URL or env.NOTIFICATION_QUEUE_WEBHOOK_URL
)
NOTIFICATION_PUBLISHER_SECRET = (
    env.NOTIFICATION_PUBLISHER_SECRET or env.NOTIFICATION_QUEUE_SECRET
)
NOTIFICATION_PUBLISHER_TIMEOUT_SECONDS = (
    env.NOTIFICATION_PUBLISHER_TIMEOUT_SECONDS
    if env.NOTIFICATION_PUBLISHER_WEBHOOK_URL
    else env.NOTIFICATION_QUEUE_TIMEOUT_SECONDS
)
SENTRY_ALERT_WEBHOOK_SECRET = env.SENTRY_ALERT_WEBHOOK_SECRET

AUTH0_DOMAIN = env.AUTH0_DOMAIN
AUTH0_CLIENT_ID = env.AUTH0_CLIENT_ID
AUTH0_AUDIENCE = env.AUTH0_AUDIENCE
AUTH0_ISSUER = env.AUTH0_ISSUER
AUTH0_ALGORITHMS = [
    algorithm.strip()
    for algorithm in env.AUTH0_ALGORITHMS.split(",")
    if algorithm.strip()
]


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

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": _timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": _timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": JWT_ALGORITHM,
    "SIGNING_KEY": JWT_SECRET_KEY,
}

AUTH_REFRESH_COOKIE_MAX_AGE = int(
    _timedelta(days=30).total_seconds()
)  # matches REFRESH_TOKEN_LIFETIME

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_RATES": {
        "auth_login": "20/hour",
        "auth_register": "10/hour",
        "auth_refresh": "60/hour",
        "checkout": "20/hour",
        "payment_status": "60/hour",
        "liqpay_callback": "300/hour",
        "subscription": "10/hour",
        "promo_code": "30/hour",
        "product_list": "300/hour",
    },
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
LIQPAY_API_URL = env.LIQPAY_API_URL
LIQPAY_SERVER_URL = env.LIQPAY_SERVER_URL
LIQPAY_RESULT_URL = env.LIQPAY_RESULT_URL
LIQPAY_SUBSCRIPTION_CALLBACK_PATH = env.LIQPAY_SUBSCRIPTION_CALLBACK_PATH
LIQPAY_SUBSCRIPTION_SERVER_URL = env.LIQPAY_SUBSCRIPTION_SERVER_URL
