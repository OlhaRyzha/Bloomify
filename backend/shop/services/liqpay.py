import base64
import hashlib
import hmac
from decimal import Decimal
from typing import Any

from django.conf import settings

from shop.models import Order
from shop.security.encoding import decode_json_payload, encode_json_payload

PAYTYPE_BY_PAYMENT_METHOD = {
    "apple_pay": "apay",
    "google_pay": "gpay",
    "card": "card",
}


class LiqPayConfigurationError(RuntimeError):
    pass


def create_signature(data: str) -> str:
    private_key = settings.LIQPAY_PRIVATE_KEY
    if not private_key:
        raise LiqPayConfigurationError("LIQPAY_PRIVATE_KEY is not configured")

    digest = hashlib.sha3_256(f"{private_key}{data}{private_key}".encode()).digest()
    return base64.b64encode(digest).decode()


def encode_data(payload: dict[str, Any]) -> str:
    return encode_json_payload(payload)


def decode_data(data: str) -> dict[str, Any]:
    return decode_json_payload(data)


def create_checkout_payload(order: Order) -> dict[str, str]:
    public_key = settings.LIQPAY_PUBLIC_KEY
    if not public_key:
        raise LiqPayConfigurationError("LIQPAY_PUBLIC_KEY is not configured")

    payload: dict[str, Any] = {
        "version": 7,
        "public_key": public_key,
        "action": "pay",
        "amount": _format_amount(order.total),
        "currency": "UAH",
        "description": f"Bloomify order #{order.pk}",
        "order_id": order.liqpay_order_id,
        "result_url": settings.LIQPAY_RESULT_URL,
        "sandbox": 1 if public_key.startswith("sandbox_") else 0,
    }

    if settings.LIQPAY_SERVER_URL:
        payload["server_url"] = settings.LIQPAY_SERVER_URL

    paytype = PAYTYPE_BY_PAYMENT_METHOD.get(order.payment_method)
    if paytype:
        payload["paytypes"] = paytype

    data = encode_data(payload)
    return {
        "checkoutUrl": settings.LIQPAY_CHECKOUT_URL,
        "data": data,
        "signature": create_signature(data),
    }


def verify_signature(data: str, signature: str) -> bool:
    return hmac.compare_digest(create_signature(data), signature)


def _format_amount(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01'))}"
