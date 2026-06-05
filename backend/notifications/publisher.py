import hashlib
import hmac
import json
import logging
from typing import Literal, TypedDict

import requests
from django.conf import settings

from notifications.telegram import TelegramNotificationError, send_telegram_message

logger = logging.getLogger(__name__)

TelegramNotificationEvent = Literal[
    "order.paid",
    "order.cash_on_delivery",
    "sentry.alert",
]


class TelegramNotificationPayload(TypedDict):
    eventType: TelegramNotificationEvent
    idempotencyKey: str
    text: str


class NotificationPublisherError(Exception):
    pass


def publish_telegram_notification(
    *,
    event_type: TelegramNotificationEvent,
    idempotency_key: str,
    text: str,
) -> None:
    payload: TelegramNotificationPayload = {
        "eventType": event_type,
        "idempotencyKey": idempotency_key,
        "text": text,
    }

    if settings.NOTIFICATION_PUBLISHER_WEBHOOK_URL:
        publish_to_notification_webhook(payload)
        return

    logger.info(
        "NOTIFICATION_PUBLISHER_WEBHOOK_URL is not configured; sending Telegram "
        "notification synchronously."
    )
    send_telegram_message(settings.TELEGRAM_ADMIN_CHAT_ID, text)


def publish_to_notification_webhook(payload: TelegramNotificationPayload) -> None:
    if not settings.NOTIFICATION_PUBLISHER_SECRET:
        raise NotificationPublisherError(
            "NOTIFICATION_PUBLISHER_SECRET is not configured"
        )

    body = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    signature = build_publisher_signature(
        body,
        settings.NOTIFICATION_PUBLISHER_SECRET,
    )

    try:
        response = requests.post(
            settings.NOTIFICATION_PUBLISHER_WEBHOOK_URL,
            data=body,
            headers={
                "Content-Type": "application/json",
                "X-Bloomify-Signature": signature,
            },
            timeout=settings.NOTIFICATION_PUBLISHER_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        raise NotificationPublisherError("Notification webhook request failed") from exc

    if not response.ok:
        raise NotificationPublisherError(
            f"Notification webhook request failed with HTTP {response.status_code}"
        )


def build_publisher_signature(body: str, secret: str) -> str:
    digest = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def publish_telegram_notification_safely(
    *,
    event_type: TelegramNotificationEvent,
    idempotency_key: str,
    text: str,
) -> None:
    try:
        publish_telegram_notification(
            event_type=event_type,
            idempotency_key=idempotency_key,
            text=text,
        )
    except (NotificationPublisherError, TelegramNotificationError):
        logger.exception("Failed to publish Telegram notification")
