import base64
import hashlib
import hmac
from decimal import Decimal
from typing import TypedDict
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import requests
from django.conf import settings

from shop.models.order import Order
from shop.security.encoding import decode_json_payload, encode_json_payload
from shop.types import JsonMapping, JsonObject, is_json_object

PAYTYPE_BY_PAYMENT_METHOD = {
    "apple_pay": "apay",
    "google_pay": "gpay",
    "card": "card",
}
SUPPORTED_LANGUAGE_CODES = {language_code for language_code, _ in settings.LANGUAGES}


class LiqPayConfigurationError(RuntimeError):
    pass


class LiqPayStatusError(RuntimeError):
    pass


class LiqPayCheckoutPayload(TypedDict):
    checkoutUrl: str
    data: str
    signature: str


def create_signature(data: str) -> str:
    private_key = settings.LIQPAY_PRIVATE_KEY
    if not private_key:
        raise LiqPayConfigurationError("LIQPAY_PRIVATE_KEY is not configured")

    digest = hashlib.sha3_256(f"{private_key}{data}{private_key}".encode()).digest()
    return base64.b64encode(digest).decode()


def encode_data(payload: JsonMapping) -> str:
    return encode_json_payload(payload)


def decode_data(data: str) -> JsonObject:
    return decode_json_payload(data)


def create_checkout_payload(
    order: Order,
    *,
    locale: str | None = None,
    payment_status_token: str,
) -> LiqPayCheckoutPayload:
    public_key = settings.LIQPAY_PUBLIC_KEY
    if not public_key:
        raise LiqPayConfigurationError("LIQPAY_PUBLIC_KEY is not configured")

    payload: JsonObject = {
        "version": 7,
        "public_key": public_key,
        "action": "pay",
        "amount": _format_amount(order.total),
        "currency": "UAH",
        "description": f"Bloomify order #{order.pk}",
        "order_id": order.liqpay_order_id,
        "result_url": build_result_url(
            order,
            locale=locale,
            payment_status_token=payment_status_token,
        ),
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


def build_result_url(
    order: Order,
    *,
    locale: str | None = None,
    payment_status_token: str,
) -> str:
    parts = urlsplit(settings.LIQPAY_RESULT_URL)
    query_params = dict(parse_qsl(parts.query, keep_blank_values=True))
    query_params["orderId"] = str(order.pk)
    query_params["orderToken"] = payment_status_token
    path = parts.path
    if locale is not None and locale in SUPPORTED_LANGUAGE_CODES:
        path = _localize_result_path(path, locale)

    return urlunsplit(
        (
            parts.scheme,
            parts.netloc,
            path,
            urlencode(query_params),
            parts.fragment,
        )
    )


def _localize_result_path(path: str, locale: str) -> str:
    normalized_path = path if path.startswith("/") else f"/{path}"
    first_segment = normalized_path.split("/")[1]
    if first_segment in SUPPORTED_LANGUAGE_CODES:
        return normalized_path

    return f"/{locale}{normalized_path}"


def fetch_payment_status(order: Order) -> JsonObject:
    public_key = settings.LIQPAY_PUBLIC_KEY
    if not public_key:
        raise LiqPayConfigurationError("LIQPAY_PUBLIC_KEY is not configured")
    if not order.liqpay_order_id:
        raise LiqPayStatusError("Order does not have a LiqPay order id")

    data = encode_data(
        {
            "version": 7,
            "public_key": public_key,
            "action": "status",
            "order_id": order.liqpay_order_id,
        }
    )
    try:
        response = requests.post(
            settings.LIQPAY_API_URL,
            data={"data": data, "signature": create_signature(data)},
            timeout=10,
        )
    except requests.RequestException as exc:
        raise LiqPayStatusError("LiqPay status request failed") from exc

    if not response.ok:
        raise LiqPayStatusError(
            f"LiqPay status request failed with HTTP {response.status_code}"
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise LiqPayStatusError("LiqPay status response is not JSON") from exc

    if not is_json_object(payload):
        raise LiqPayStatusError("LiqPay status response is not an object")
    return payload


def verify_signature(data: str, signature: str) -> bool:
    return hmac.compare_digest(create_signature(data), signature)


def _format_amount(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01'))}"
