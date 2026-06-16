import logging
from decimal import Decimal, InvalidOperation
from typing import TypedDict, cast

from common.pagination import (
    build_paginated_response,
    paginate_items,
)
from django.contrib.auth.models import User
from django.db import transaction
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from notifications.customer_bot import notify_customer_order_subscribers
from notifications.messages import (
    build_order_cash_on_delivery_message,
    build_order_paid_message,
)
from notifications.publisher import publish_telegram_notification_safely
from rest_framework import permissions, serializers, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from shop.models.order import Order
from shop.security.order_access import hash_order_access_token
from shop.serializers.order import (
    CheckoutCreateSerializer,
    CheckoutOrderPayload,
    PaymentStatusRequestSerializer,
    create_checkout_order,
)
from shop.serializers.order_list import serialize_order
from shop.services.payment_provider_types import (
    PaymentCheckoutPayload,
    PaymentProviderConfigurationError,
    PaymentProviderPayloadError,
    PaymentProviderStatusError,
    has_paid_notification_been_sent,
    mark_paid_notification_as_sent,
)
from shop.services.payment_providers import get_payment_provider

logger = logging.getLogger(__name__)


class PaymentStatusResponse(TypedDict):
    orderId: int
    status: str
    paymentStatus: str
    paymentProvider: str
    paymentMethod: str
    paymentStatusToken: str


class PaymentStatusResponseSerializer(serializers.Serializer):
    orderId = serializers.IntegerField()
    status = serializers.CharField()
    paymentStatus = serializers.CharField()
    paymentProvider = serializers.CharField(allow_blank=True)
    paymentMethod = serializers.CharField(allow_blank=True)
    paymentStatusToken = serializers.CharField()


class OrderListItemProductSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    productId = serializers.IntegerField()
    name = serializers.CharField()
    imageUrl = serializers.CharField(allow_blank=True)
    quantity = serializers.IntegerField()
    unitPrice = serializers.DecimalField(max_digits=10, decimal_places=2)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)


class OrderListItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    status = serializers.CharField()
    paymentStatus = serializers.CharField()
    paymentProvider = serializers.CharField(allow_blank=True)
    paymentMethod = serializers.CharField(allow_blank=True)
    createdAt = serializers.DateTimeField()
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    items = OrderListItemProductSerializer(many=True)


class OrderListResponseSerializer(serializers.Serializer):
    items = OrderListItemSerializer(many=True)
    page = serializers.IntegerField()
    pageSize = serializers.IntegerField()
    total = serializers.IntegerField()
    totalPages = serializers.IntegerField()
    hasNextPage = serializers.BooleanField()
    nextPage = serializers.IntegerField(allow_null=True)


def publish_order_paid_notification_safely(order_id: int) -> None:
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        logger.exception("Failed to load paid order for Telegram notification")
        return

    publish_telegram_notification_safely(
        event_type="order.paid",
        idempotency_key=f"order:{order_id}:paid",
        text=build_order_paid_message(order),
    )


def publish_cash_on_delivery_notification_safely(order_id: int) -> None:
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        logger.exception(
            "Failed to load cash-on-delivery order for Telegram notification"
        )
        return

    publish_telegram_notification_safely(
        event_type="order.cash_on_delivery",
        idempotency_key=f"order:{order_id}:cash_on_delivery",
        text=build_order_cash_on_delivery_message(order),
    )


def schedule_paid_notification_after_checkout_return(order: Order) -> None:
    if order.payment_status != "paid" or has_paid_notification_been_sent(order):
        return

    mark_paid_notification_as_sent(order)
    transaction.on_commit(lambda: publish_order_paid_notification_safely(order.id))
    transaction.on_commit(lambda: notify_customer_order_subscribers(order))


def build_payment_status_response(
    order: Order,
    *,
    payment_status_token: str,
) -> PaymentStatusResponse:
    return {
        "orderId": order.pk,
        "status": order.status,
        "paymentStatus": order.payment_status,
        "paymentProvider": order.payment_provider,
        "paymentMethod": order.payment_method,
        "paymentStatusToken": payment_status_token,
    }


class CheckoutCreateView(APIView):
    # AllowAny: guest checkout is supported — no account required to place an order.
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "checkout"

    @extend_schema(
        request=CheckoutCreateSerializer,
        responses={201: OpenApiTypes.OBJECT},
    )
    def post(self, request: Request) -> Response:
        serializer = CheckoutCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = cast(CheckoutOrderPayload, serializer.validated_data)
        checkout_result = create_checkout_order(
            payload,
            user=request.user if request.user.is_authenticated else None,
        )
        order = checkout_result["order"]
        payment_status_token = checkout_result["payment_status_token"]

        checkout_payloads: dict[str, PaymentCheckoutPayload | None] = {"liqpay": None}
        if order.payment_provider:
            try:
                payment_provider = get_payment_provider(order.payment_provider)
                checkout_payloads[payment_provider.checkout_response_key] = (
                    payment_provider.create_checkout_payload(
                        order,
                        locale=payload.get("locale"),
                        payment_status_token=payment_status_token,
                    )
                )
            except PaymentProviderConfigurationError as exc:
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
                lambda: publish_cash_on_delivery_notification_safely(order.id)
            )

        return Response(
            {
                "orderId": order.pk,
                "status": order.status,
                "paymentStatus": order.payment_status,
                "paymentProvider": order.payment_provider,
                "paymentMethod": order.payment_method,
                "paymentStatusToken": payment_status_token,
                "liqpay": checkout_payloads["liqpay"],
            },
            status=status.HTTP_201_CREATED,
        )


class LiqPayCallbackView(APIView):
    # AllowAny + no auth: LiqPay POSTs here without auth headers.
    # Security is enforced by HMAC signature verification on every request.
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "liqpay_callback"

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

        payment_provider = get_payment_provider("liqpay")

        try:
            is_valid_signature = payment_provider.verify_callback_signature(
                data,
                signature,
            )
        except PaymentProviderConfigurationError as exc:
            logger.warning("Failed to verify payment callback signature: %s", exc)
            return Response(
                {"detail": "Unable to verify LiqPay signature."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not is_valid_signature:
            return Response(
                {"detail": "Invalid LiqPay signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = payment_provider.decode_callback_payload(data)
        except PaymentProviderPayloadError:
            return Response(
                {"detail": "Invalid LiqPay data payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                order = payment_provider.get_callback_order(payload)
                logger.info(
                    "Payment callback received for provider %s order %s with status %s",
                    payment_provider.key,
                    order.pk,
                    payload.get("status"),
                )
                try:
                    callback_amount = Decimal(str(payload.get("amount", "0")))
                except InvalidOperation:
                    callback_amount = Decimal("0")
                callback_currency = str(payload.get("currency", "")).upper()
                if callback_amount != order.total or callback_currency != "UAH":
                    logger.warning(
                        "Order callback amount/currency mismatch for order %s: expected %s UAH, got %s %s",
                        order.pk,
                        order.total,
                        callback_amount,
                        callback_currency,
                    )
                    return Response(
                        {"detail": "Amount or currency mismatch."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                payment_provider.apply_payment_payload(
                    order,
                    payload,
                    from_callback=True,
                )
        except PaymentProviderPayloadError:
            return Response(
                {"detail": "Missing LiqPay order id."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({"status": "ok"})


class LiqPayPaymentStatusView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment_status"

    @extend_schema(
        request=PaymentStatusRequestSerializer,
        responses={200: PaymentStatusResponseSerializer},
    )
    def post(self, request: Request, pk: int) -> Response:
        serializer = PaymentStatusRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]

        try:
            order = Order.objects.exclude(payment_provider="").get(pk=pk)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            not token
            or hash_order_access_token(token) != order.payment_status_token_hash
        ):
            return Response(
                {"detail": "Invalid payment status token."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            payment_provider = get_payment_provider(order.payment_provider)
        except PaymentProviderConfigurationError as exc:
            logger.warning("Unsupported payment provider for order %s: %s", pk, exc)
            return Response(
                {"detail": "Unsupported payment provider."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if order.payment_status == "paid":
            with transaction.atomic():
                order = Order.objects.select_for_update().get(pk=order.pk)
                schedule_paid_notification_after_checkout_return(order)
            return Response(
                build_payment_status_response(
                    order,
                    payment_status_token=token,
                )
            )

        try:
            payload = payment_provider.sync_payment_status(order)
        except (PaymentProviderConfigurationError, PaymentProviderStatusError) as exc:
            logger.warning("Failed to sync payment status for order %s: %s", pk, exc)
            return Response(
                {"detail": "Unable to sync payment status."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        logger.info(
            "Payment status synced for provider %s order %s with status %s",
            payment_provider.key,
            order.pk,
            payload.get("status"),
        )
        with transaction.atomic():
            order = Order.objects.select_for_update().get(pk=order.pk)
            application = payment_provider.apply_payment_payload(order, payload)
            if application["became_paid"]:
                schedule_paid_notification_after_checkout_return(order)

        return Response(
            build_payment_status_response(
                order,
                payment_status_token=token,
            )
        )


class OrderListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses={200: OrderListResponseSerializer})
    def get(self, request: Request) -> Response:
        user = request.user

        if not isinstance(user, User):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        orders = (
            Order.objects.filter(user=user)
            .prefetch_related("items__product")
            .order_by("-created_at")
        )

        paginated = paginate_items(
            request=request,
            items=orders,
            default_page_size=6,
        )

        serialized_items = [
            serialize_order(order, request=request) for order in paginated.items
        ]

        return Response(
            build_paginated_response(
                paginated=paginated,
                serialized_items=serialized_items,
            )
        )
