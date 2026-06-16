from decimal import Decimal

from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from shop.models.promo_code import PromoCode


class ValidatePromoCodeView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "promo_code"

    def post(self, request: Request) -> Response:
        code = str(request.data.get("code", "")).upper().strip()
        raw_subtotal = request.data.get("subtotal")

        if not code:
            return Response(
                {"detail": "Code is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            subtotal = (
                Decimal(str(raw_subtotal)) if raw_subtotal is not None else Decimal("0")
            )
        except Exception:
            return Response(
                {"detail": "Invalid subtotal."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            promo = PromoCode.objects.get(code=code)
        except PromoCode.DoesNotExist:
            return Response(
                {"detail": "Promo code not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if not promo.is_valid():
            return Response(
                {"detail": "Promo code is expired or inactive."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        discount = promo.calculate_discount(subtotal)

        return Response(
            {
                "code": promo.code,
                "discountType": promo.discount_type,
                "discountValue": str(promo.discount_value),
                "discount": str(discount),
            }
        )
