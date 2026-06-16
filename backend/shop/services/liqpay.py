import base64
import binascii
import hashlib
import hmac
from decimal import Decimal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import requests
from django.conf import settings

from shop.models.order import Order
from shop.security.encoding import decode_json_payload, encode_json_payload
from shop.services.payment_provider_types import (
    PaymentApplication,
    PaymentCheckoutPayload,
    PaymentProviderConfigurationError,
    PaymentProviderPayloadError,
    PaymentProviderStatusError,
    apply_provider_payment_payload,
)
from shop.types import JsonMapping, JsonObject, PaymentProviderPayload, is_json_object

PAYTYPE_BY_PAYMENT_METHOD = {
    "apple_pay": "apay",
    "google_pay": "gpay",
    "card": "card",
}
SUPPORTED_LANGUAGE_CODES = {language_code for language_code, _ in settings.LANGUAGES}


class LiqPayConfigurationError(PaymentProviderConfigurationError):
    pass


class LiqPayStatusError(PaymentProviderStatusError):
    pass


class LiqPayPayloadError(PaymentProviderPayloadError):
    pass


def create_signature(data: str) -> str:
    private_key = settings.LIQPAY_PRIVATE_KEY
    if not private_key:
        raise LiqPayConfigurationError("LIQPAY_PRIVATE_KEY is not configured")

    digest = hashlib.sha1(f"{private_key}{data}{private_key}".encode()).digest()
    return base64.b64encode(digest).decode()


def encode_data(payload: JsonMapping) -> str:
    return encode_json_payload(payload)


def decode_data(data: str) -> JsonObject:
    try:
        return decode_json_payload(data)
    except (binascii.Error, UnicodeDecodeError, ValueError) as exc:
        raise LiqPayPayloadError("Invalid LiqPay data payload") from exc


def create_checkout_payload(
    order: Order,
    *,
    locale: str | None = None,
    payment_status_token: str,
) -> PaymentCheckoutPayload:
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
        "order_id": _get_provider_order_id(order),
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
    provider_order_id = _get_provider_order_id(order)
    if not provider_order_id:
        raise LiqPayStatusError("Order does not have a LiqPay order id")

    data = encode_data(
        {
            "version": 7,
            "public_key": public_key,
            "action": "status",
            "order_id": provider_order_id,
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


def apply_payment_payload(
    order: Order,
    payload: PaymentProviderPayload,
    *,
    sandbox_is_paid: bool = True,
) -> PaymentApplication:
    payment_status = str(payload.get("status", "")).lower()
    paid_statuses = {"success"}
    if sandbox_is_paid:
        paid_statuses.add("sandbox")

    application = apply_provider_payment_payload(
        order,
        payload,
        provider_payment_id=str(payload.get("payment_id", "")),
        provider_is_paid=payment_status in paid_statuses,
    )
    order.liqpay_payment_id = order.provider_payment_id
    order.save(update_fields=["liqpay_payment_id"])
    return application


class LiqPayProvider:
    key = "liqpay"
    checkout_response_key = "liqpay"

    def assign_order_reference(self, order: Order) -> None:
        provider_order_id = f"bloomify-{order.pk}"
        order.provider_order_id = provider_order_id
        order.liqpay_order_id = provider_order_id
        order.save(update_fields=["provider_order_id", "liqpay_order_id"])

    def create_checkout_payload(
        self,
        order: Order,
        *,
        locale: str | None,
        payment_status_token: str,
    ) -> PaymentCheckoutPayload:
        return create_checkout_payload(
            order,
            locale=locale,
            payment_status_token=payment_status_token,
        )

    def verify_callback_signature(self, data: str, signature: str) -> bool:
        return verify_signature(data, signature)

    def decode_callback_payload(self, data: str) -> JsonObject:
        return decode_data(data)

    def get_callback_order(self, payload: PaymentProviderPayload) -> Order:
        order_id = payload.get("order_id")
        if not isinstance(order_id, str):
            raise LiqPayPayloadError("Missing LiqPay order id")
        try:
            return Order.objects.select_for_update().get(
                payment_provider=self.key,
                provider_order_id=order_id,
            )
        except Order.DoesNotExist:
            return Order.objects.select_for_update().get(
                payment_provider=self.key,
                liqpay_order_id=order_id,
            )

    def sync_payment_status(self, order: Order) -> JsonObject:
        return fetch_payment_status(order)

    def apply_payment_payload(
        self,
        order: Order,
        payload: PaymentProviderPayload,
        *,
        from_callback: bool = False,
    ) -> PaymentApplication:
        return apply_payment_payload(
            order,
            payload,
            sandbox_is_paid=not from_callback,
        )


LIQPAY_PROVIDER = LiqPayProvider()


def _format_amount(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01'))}"


def _get_provider_order_id(order: Order) -> str | None:
    return order.provider_order_id or order.liqpay_order_id
