import logging

from django.db import transaction
from drf_spectacular.utils import OpenApiTypes, extend_schema, inline_serializer
from notifications.tasks import (
    send_order_cash_on_delivery_telegram_notification,
    send_order_paid_telegram_notification,
)
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from shop.models.order import Order
from shop.serializers.order import (
    PAYMENT_METHODS_WITH_LIQPAY,
    CheckoutCreateSerializer,
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

logger = logging.getLogger(__name__)


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


def apply_liqpay_payment_payload(order: Order, payload: dict) -> bool:
    payment_status = str(payload.get("status", "")).lower()
    was_paid_before = order.payment_status == "paid"

    order.payment_payload = payload
    order.liqpay_payment_id = str(payload.get("payment_id", ""))
    if payment_status in {"success", "sandbox"}:
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


def build_payment_status_response(order: Order) -> dict[str, str | int]:
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
    def post(self, request):
        serializer = CheckoutCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = create_checkout_order(serializer.validated_data)

        liqpay_payload = None
        if order.payment_method in PAYMENT_METHODS_WITH_LIQPAY:
            try:
                liqpay_payload = create_checkout_payload(order)
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
    def post(self, request):
        data = request.data.get("data")
        signature = request.data.get("signature")

        if not data or not signature:
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
        if apply_liqpay_payment_payload(order, payload):
            transaction.on_commit(lambda: send_order_paid_notification_safely(order.id))
        return Response({"status": "ok"})


class LiqPayPaymentStatusView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def post(self, request, pk: int):
        try:
            order = Order.objects.get(pk=pk, payment_provider="liqpay")
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.payment_status == "paid":
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
            transaction.on_commit(lambda: send_order_paid_notification_safely(order.id))

        return Response(build_payment_status_response(order))
