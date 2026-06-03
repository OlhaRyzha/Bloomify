import logging
from typing import TypedDict, cast

from django.db import transaction
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from notifications.tasks import (
    send_order_cash_on_delivery_telegram_notification,
    send_order_paid_telegram_notification,
)
from rest_framework import permissions, serializers, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from shop.models.order import Order
from shop.serializers.order import (
    PAYMENT_METHODS_WITH_LIQPAY,
    CheckoutCreateSerializer,
    CheckoutOrderPayload,
    create_checkout_order,
)
from shop.services.liqpay import (
    LiqPayConfigurationError,
    LiqPayStatusError,
    create_checkout_payload,
    decode_data,
    fetch_payment_status,
    verify_signature,
)
from shop.types import PaymentProviderPayload

logger = logging.getLogger(__name__)
PAID_TELEGRAM_NOTIFICATION_SENT_KEY = "paid_telegram_notification_sent"


class PaymentStatusResponse(TypedDict):
    orderId: int
    status: str
    paymentStatus: str
    paymentProvider: str
    paymentMethod: str


def send_order_paid_notification_safely(order_id: int) -> None:
    try:
        send_order_paid_telegram_notification(order_id)
    except Exception:
        logger.exception("Failed to send paid order Telegram notification")


def send_cash_on_delivery_notification_safely(order_id: int) -> None:
    try:
        send_order_cash_on_delivery_telegram_notification(order_id)
    except Exception:
        logger.exception("Failed to send cash-on-delivery order Telegram notification")


def has_paid_notification_been_sent(order: Order) -> bool:
    return order.payment_payload.get(PAID_TELEGRAM_NOTIFICATION_SENT_KEY) is True


def mark_paid_notification_as_sent(order: Order) -> None:
    order.payment_payload = {
        **order.payment_payload,
        PAID_TELEGRAM_NOTIFICATION_SENT_KEY: True,
    }
    order.save(update_fields=["payment_payload"])


def schedule_paid_notification_after_checkout_return(order: Order) -> None:
    if order.payment_status != "paid" or has_paid_notification_been_sent(order):
        return

    mark_paid_notification_as_sent(order)
    transaction.on_commit(lambda: send_order_paid_notification_safely(order.id))


def apply_liqpay_payment_payload(
    order: Order,
    payload: PaymentProviderPayload,
    *,
    sandbox_is_paid: bool = True,
) -> bool:
    payment_status = str(payload.get("status", "")).lower()
    was_paid_before = order.payment_status == "paid"
    paid_statuses = {"success"}
    if sandbox_is_paid:
        paid_statuses.add("sandbox")

    order.payment_payload = payload
    order.liqpay_payment_id = str(payload.get("payment_id", ""))
    if payment_status in paid_statuses:
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
            "liqpay_payment_id",
            "payment_status",
            "status",
        ]
    )

    return order.payment_status == "paid" and not was_paid_before


def build_payment_status_response(order: Order) -> PaymentStatusResponse:
    return {
        "orderId": order.pk,
        "status": order.status,
        "paymentStatus": order.payment_status,
        "paymentProvider": order.payment_provider,
        "paymentMethod": order.payment_method,
    }


class CheckoutCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=CheckoutCreateSerializer,
        responses={201: OpenApiTypes.OBJECT},
    )
    def post(self, request: Request) -> Response:
        serializer = CheckoutCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = cast(CheckoutOrderPayload, serializer.validated_data)
        order = create_checkout_order(payload)

        liqpay_payload = None
        if order.payment_method in PAYMENT_METHODS_WITH_LIQPAY:
            try:
                liqpay_payload = create_checkout_payload(
                    order,
                    locale=payload.get("locale"),
                )
            except LiqPayConfigurationError as exc:
                order.payment_status = "failed"
                order.status = "failed"
                order.payment_payload = {"configuration_error": str(exc)}
                order.save(
                    update_fields=["payment_status", "status", "payment_payload"]
                )
                return Response(
                    {"detail": str(exc)},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
        elif order.payment_method == "cash_on_delivery":
            transaction.on_commit(
                lambda: send_cash_on_delivery_notification_safely(order.id)
            )

        return Response(
            {
                "orderId": order.pk,
                "status": order.status,
                "paymentStatus": order.payment_status,
                "paymentProvider": order.payment_provider,
                "paymentMethod": order.payment_method,
                "liqpay": liqpay_payload,
            },
            status=status.HTTP_201_CREATED,
        )


class LiqPayCallbackView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=inline_serializer(
            name="LiqPayCallbackRequest",
            fields={
                "data": serializers.CharField(),
                "signature": serializers.CharField(),
            },
        ),
        responses={200: OpenApiTypes.OBJECT},
    )
    def post(self, request: Request) -> Response:
        data = request.data.get("data")
        signature = request.data.get("signature")

        if not isinstance(data, str) or not isinstance(signature, str):
            return Response(
                {"detail": "Missing LiqPay data or signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not verify_signature(data, signature):
            return Response(
                {"detail": "Invalid LiqPay signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = decode_data(data)
        order_id = payload.get("order_id")
        if not isinstance(order_id, str):
            return Response(
                {"detail": "Missing LiqPay order id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.get(liqpay_order_id=order_id)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        logger.info(
            "LiqPay callback received for order %s with status %s",
            order.pk,
            payload.get("status"),
        )
        apply_liqpay_payment_payload(order, payload, sandbox_is_paid=False)
        return Response({"status": "ok"})


class LiqPayPaymentStatusView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def post(self, request: Request, pk: int) -> Response:
        try:
            order = Order.objects.get(pk=pk, payment_provider="liqpay")
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.payment_status == "paid":
            schedule_paid_notification_after_checkout_return(order)
            return Response(build_payment_status_response(order))

        try:
            payload = fetch_payment_status(order)
        except (LiqPayConfigurationError, LiqPayStatusError) as exc:
            logger.warning("Failed to sync LiqPay status for order %s: %s", pk, exc)
            return Response(
                {"detail": "Unable to sync payment status."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        logger.info(
            "LiqPay status synced for order %s with status %s",
            order.pk,
            payload.get("status"),
        )
        if apply_liqpay_payment_payload(order, payload):
            schedule_paid_notification_after_checkout_return(order)

        return Response(build_payment_status_response(order))
