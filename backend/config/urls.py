from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import URLPattern, URLResolver, include, path
from django.views.generic import RedirectView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns: list[URLPattern | URLResolver] = [
    path("admin/", admin.site.urls),
    path("i18n/", include("django.conf.urls.i18n")),
]

if settings.SCHEMA_PATH:
    urlpatterns.append(
        path(settings.SCHEMA_PATH, SpectacularAPIView.as_view(), name="schema")
    )

if settings.DOCS_PATH:
    urlpatterns.append(
        path(
            settings.DOCS_PATH,
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger_ui",
        )
    )

if settings.REDOC_PATH:
    urlpatterns.append(
        path(
            settings.REDOC_PATH,
            SpectacularRedocView.as_view(url_name="schema"),
            name="redoc",
        )
    )

urlpatterns.extend(
    [
        path(
            "favicon.ico",
            RedirectView.as_view(url=f"{settings.STATIC_URL}bloomify/favicon-32.png"),
        ),
        path("notifications/", include("notifications.urls")),
        path("", include("shop.urls")),
    ]
)

if settings.DEBUG:
    urlpatterns.extend(staticfiles_urlpatterns())
    urlpatterns.extend(static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT))
