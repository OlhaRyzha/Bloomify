from django.urls import path

from notifications.views import SentryAlertWebhookView

app_name = "notifications"

urlpatterns = [
    path(
        "sentry-alert",
        SentryAlertWebhookView.as_view(),
        name="sentry-alert",
    ),
]
