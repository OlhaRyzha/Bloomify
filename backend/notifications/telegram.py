from typing import Any

import requests
from django.conf import settings


class TelegramNotificationError(Exception):
    pass


def send_telegram_message(chat_id: str, text: str) -> None:
    if not settings.TELEGRAM_BOT_TOKEN:
        raise TelegramNotificationError("TELEGRAM_BOT_TOKEN is not configured")

    if not chat_id:
        raise TelegramNotificationError("Telegram chat_id is required")

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"

    payload: dict[str, Any] = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    response = requests.post(url, json=payload, timeout=10)

    if not response.ok:
        raise TelegramNotificationError(
            f"Telegram API error: {response.status_code} {response.text}"
        )
