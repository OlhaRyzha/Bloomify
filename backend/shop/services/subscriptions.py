"""Subscription payment workflows shared by the LiqPay callback view and
management commands (sync_liqpay_payments)."""

import logging
from datetime import date

from django.conf import settings
from django.db import transaction

from shop.models.subscription import SubscriptionPayment
from shop.services.liqpay import (
    LiqPayStatusError,
    fetch_status_by_provider_order_id,
)
from shop.types import JsonObject

logger = logging.getLogger(__name__)

PAID_PROVIDER_STATUSES = {"success"}
FAILED_PROVIDER_STATUSES = {"failure", "error", "reversed"}


def get_paid_provider_statuses() -> set[str]:
    paid = set(PAID_PROVIDER_STATUSES)
    if settings.LIQPAY_PUBLIC_KEY.startswith("sandbox_"):
        paid.add("sandbox")
    return paid


def apply_subscription_payment_payload(
    payment: SubscriptionPayment, payload: JsonObject
) -> SubscriptionPayment:
    """Apply a LiqPay payload (callback or status API) to a subscription payment.

    Idempotent: re-applying the same paid payload keeps the payment paid and
    the subscription active. Caller is responsible for signature/amount
    validation when the payload comes from an untrusted source.
    """
    payment_status = str(payload.get("status", "")).lower()
    paid_statuses = get_paid_provider_statuses()

    with transaction.atomic():
        payment = SubscriptionPayment.objects.select_for_update().get(pk=payment.pk)
        payment.payment_payload = payload
        payment.provider_payment_id = str(payload.get("payment_id", ""))

        if payment_status in paid_statuses:
            payment.status = "paid"
            sub = payment.subscription
            sub.status = "active"
            sub.start_date = date.today()
            sub_update_fields = ["status", "start_date"]
            if payment.target_plan is not None:
                sub.plan = payment.target_plan
                sub_update_fields.append("plan")
            sub.save(update_fields=sub_update_fields)
        elif payment_status in FAILED_PROVIDER_STATUSES:
            payment.status = "canceled"
            sub = payment.subscription
            if sub.status == "pending":
                sub.status = "canceled"
                sub.save(update_fields=["status"])

        payment.save(
            update_fields=[
                "payment_payload",
                "provider_payment_id",
                "status",
            ]
        )

    logger.info(
        "Subscription payment %s updated to status=%s (liqpay status=%s)",
        payment.pk,
        payment.status,
        payment_status,
    )
    return payment


def sync_subscription_payment_status(
    payment: SubscriptionPayment,
) -> SubscriptionPayment:
    """Query the LiqPay status API for a payment and apply the result.

    Used to reconcile payments whose webhook was missed or delayed.
    """
    if not payment.provider_order_id:
        raise LiqPayStatusError(
            f"Subscription payment {payment.pk} has no provider order id"
        )
    payload = fetch_status_by_provider_order_id(payment.provider_order_id)
    return apply_subscription_payment_payload(payment, payload)
