from django.urls import path

from notifications.views import SentryAlertWebhookView, TelegramCustomerWebhookView

app_name = "notifications"

urlpatterns = [
    path(
        "sentry-alert",
        SentryAlertWebhookView.as_view(),
        name="sentry-alert",
    ),
    path(
        "telegram/customer",
        TelegramCustomerWebhookView.as_view(),
        name="telegram-customer",
    ),
]
