from drf_spectacular.utils import OpenApiTypes, extend_schema, inline_serializer
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
    create_checkout_payload,
    decode_data,
    verify_signature,
)


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
        payment_status = payload.get("status", "")

        try:
            order = Order.objects.get(liqpay_order_id=order_id)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

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
        return Response({"status": "ok"})
