import hashlib
import logging

from django.conf import settings
from django.utils.html import escape
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.queue import NotificationQueueError, publish_telegram_notification
from notifications.telegram import TelegramNotificationError
from shop.types import JsonMapping, is_json_object

logger = logging.getLogger(__name__)


def get_nested_value(payload: JsonMapping, *keys: str) -> object | None:
    value: object | None = dict(payload)
    for key in keys:
        if not isinstance(value, dict):
            return None
        value = value.get(key)
    return value


def first_present(*values: object | None) -> str:
    for value in values:
        if value not in (None, ""):
            return str(value)
    return ""


def build_sentry_alert_message(payload: JsonMapping) -> str:
    event_raw = payload.get("event")
    issue_raw = payload.get("issue")
    event: JsonMapping = event_raw if isinstance(event_raw, dict) else {}
    issue: JsonMapping = issue_raw if isinstance(issue_raw, dict) else {}

    title = first_present(
        payload.get("title"),
        issue.get("title"),
        event.get("title"),
        event.get("message"),
        "Sentry alert",
    )
    project = first_present(
        get_nested_value(payload, "project", "slug"),
        payload.get("project_name"),
        payload.get("project"),
        event.get("project"),
    )
    environment = first_present(
        payload.get("environment"),
        event.get("environment"),
        get_nested_value(event, "tags", "environment"),
    )
    level = first_present(payload.get("level"), event.get("level"))
    culprit = first_present(payload.get("culprit"), event.get("culprit"))
    url = first_present(
        payload.get("url"),
        payload.get("web_url"),
        issue.get("url"),
        issue.get("web_url"),
        event.get("url"),
        event.get("web_url"),
    )

    lines = [
        "🚨 <b>Sentry alert</b>",
        f"Issue: <b>{escape(title)}</b>",
    ]
    if project:
        lines.append(f"Project: {escape(project)}")
    if environment:
        lines.append(f"Environment: {escape(environment)}")
    if level:
        lines.append(f"Level: {escape(level)}")
    if culprit:
        lines.append(f"Culprit: {escape(culprit)}")
    if url:
        lines.append(f"Link: {escape(url)}")

    return "\n".join(lines)


class SentryAlertWebhookView(APIView):
    authentication_classes: list[type] = []
    permission_classes = [AllowAny]

    @extend_schema(
        request=OpenApiTypes.OBJECT,
        responses={200: OpenApiTypes.OBJECT},
    )
    def post(self, request: Request) -> Response:
        if not settings.SENTRY_ALERT_WEBHOOK_SECRET:
            return Response(
                {"detail": "Sentry alert webhook is not configured."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not self.has_valid_secret(request):
            return Response(
                {"detail": "Invalid webhook token."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not is_json_object(request.data):
            return Response(
                {"detail": "Invalid webhook payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = request.data
        message = build_sentry_alert_message(payload)
        try:
            publish_telegram_notification(
                event_type="sentry.alert",
                idempotency_key=build_sentry_alert_idempotency_key(payload),
                text=message,
            )
        except (NotificationQueueError, TelegramNotificationError):
            logger.exception("Failed to publish Sentry alert Telegram notification")
            return Response(
                {"detail": "Telegram notification failed."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"status": "ok"})

    def has_valid_secret(self, request: Request) -> bool:
        expected_secret = settings.SENTRY_ALERT_WEBHOOK_SECRET
        auth_header = request.headers.get("Authorization", "")
        bearer_prefix = "Bearer "
        bearer_secret = (
            auth_header[len(bearer_prefix) :]
            if auth_header.startswith(bearer_prefix)
            else ""
        )
        provided_secret = (
            request.headers.get("X-Bloomify-Sentry-Secret")
            or bearer_secret
            or request.query_params.get("token")
        )
        return provided_secret == expected_secret


def build_sentry_alert_idempotency_key(payload: JsonMapping) -> str:
    url = first_present(
        payload.get("url"),
        payload.get("web_url"),
        get_nested_value(payload, "issue", "url"),
        get_nested_value(payload, "event", "url"),
    )
    title = first_present(
        payload.get("title"),
        get_nested_value(payload, "event", "title"),
    )
    raw_key = url or title or str(payload)
    digest = hashlib.sha256(raw_key.encode()).hexdigest()
    return f"sentry-alert:{digest}"
