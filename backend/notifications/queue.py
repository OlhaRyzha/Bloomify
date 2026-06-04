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


class NotificationQueueError(Exception):
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

    if settings.NOTIFICATION_QUEUE_WEBHOOK_URL:
        publish_to_vercel_queue(payload)
        return

    logger.info(
        "NOTIFICATION_QUEUE_WEBHOOK_URL is not configured; sending Telegram "
        "notification synchronously."
    )
    send_telegram_message(settings.TELEGRAM_ADMIN_CHAT_ID, text)


def publish_to_vercel_queue(payload: TelegramNotificationPayload) -> None:
    if not settings.NOTIFICATION_QUEUE_SECRET:
        raise NotificationQueueError("NOTIFICATION_QUEUE_SECRET is not configured")

    body = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    signature = build_queue_signature(body, settings.NOTIFICATION_QUEUE_SECRET)

    try:
        response = requests.post(
            settings.NOTIFICATION_QUEUE_WEBHOOK_URL,
            data=body,
            headers={
                "Content-Type": "application/json",
                "X-Bloomify-Signature": signature,
            },
            timeout=settings.NOTIFICATION_QUEUE_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        raise NotificationQueueError("Notification queue request failed") from exc

    if not response.ok:
        raise NotificationQueueError(
            f"Notification queue request failed with HTTP {response.status_code}"
        )


def build_queue_signature(body: str, secret: str) -> str:
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
    except (NotificationQueueError, TelegramNotificationError):
        logger.exception("Failed to publish Telegram notification")
