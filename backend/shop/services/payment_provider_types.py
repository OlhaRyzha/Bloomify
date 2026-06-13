from typing import Protocol, TypedDict

from shop.models.order import Order
from shop.types import JsonObject, PaymentProviderPayload

PAID_TELEGRAM_NOTIFICATION_SENT_KEY = "paid_telegram_notification_sent"


class PaymentProviderConfigurationError(RuntimeError):
    pass


class PaymentProviderStatusError(RuntimeError):
    pass


class PaymentProviderPayloadError(ValueError):
    pass


class PaymentCheckoutPayload(TypedDict):
    checkoutUrl: str
    data: str
    signature: str


class PaymentApplication(TypedDict):
    became_paid: bool


class PaymentProvider(Protocol):
    key: str
    checkout_response_key: str

    def assign_order_reference(self, order: Order) -> None: ...

    def create_checkout_payload(
        self,
        order: Order,
        *,
        locale: str | None,
        payment_status_token: str,
    ) -> PaymentCheckoutPayload: ...

    def verify_callback_signature(self, data: str, signature: str) -> bool: ...

    def decode_callback_payload(self, data: str) -> JsonObject: ...

    def get_callback_order(self, payload: PaymentProviderPayload) -> Order: ...

    def sync_payment_status(self, order: Order) -> JsonObject: ...

    def apply_payment_payload(
        self,
        order: Order,
        payload: PaymentProviderPayload,
        *,
        from_callback: bool = False,
    ) -> PaymentApplication: ...


def has_paid_notification_been_sent(order: Order) -> bool:
    return order.payment_payload.get(PAID_TELEGRAM_NOTIFICATION_SENT_KEY) is True


def mark_paid_notification_as_sent(order: Order) -> None:
    order.payment_payload = {
        **order.payment_payload,
        PAID_TELEGRAM_NOTIFICATION_SENT_KEY: True,
    }
    order.save(update_fields=["payment_payload"])


def apply_provider_payment_payload(
    order: Order,
    payload: PaymentProviderPayload,
    *,
    provider_payment_id: str,
    provider_is_paid: bool,
) -> PaymentApplication:
    payment_status = str(payload.get("status", "")).lower()
    was_paid_before = order.payment_status == "paid"

    order.payment_payload = payload
    order.provider_payment_id = provider_payment_id
    if provider_is_paid:
        order.payment_status = "paid"
        order.status = "paid"
    elif payment_status in {"failure", "error", "reversed"}:
        order.payment_status = "failed"
        order.status = "failed"
    else:
        order.payment_status = "pending"

    order.save(
        update_fields=[
            "payment_payload",
            "provider_payment_id",
            "payment_status",
            "status",
        ]
    )

    return {"became_paid": order.payment_status == "paid" and not was_paid_before}
