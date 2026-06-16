import logging
from datetime import date
from decimal import Decimal, InvalidOperation
from urllib.parse import urlencode, urlsplit, urlunsplit

from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from shop.models.subscription import Subscription, SubscriptionPayment, SubscriptionPlan
from shop.security.order_access import (
    create_order_access_token,
    hash_order_access_token,
)
from shop.serializers.subscriptions import (
    SubscribeRequestSerializer,
    SubscriptionPlanSerializer,
    SubscriptionSerializer,
    UpgradeRequestSerializer,
)
from shop.services.liqpay import (
    create_signature,
    decode_data,
    encode_data,
    verify_signature,
)
from shop.services.payment_provider_types import (
    PaymentCheckoutPayload,
    PaymentProviderConfigurationError,
)
from shop.types import JsonObject

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGE_CODES = {lc for lc, _ in settings.LANGUAGES}


def _build_subscription_result_url(
    payment: SubscriptionPayment,
    *,
    locale: str | None,
    payment_status_token: str,
) -> str:
    parts = urlsplit(settings.LIQPAY_RESULT_URL)
    path = "/subscriptions"
    if locale and locale in SUPPORTED_LANGUAGE_CODES:
        path = f"/{locale}/subscriptions"

    query_params = {
        "subscriptionId": str(payment.subscription.pk),
        "paymentId": str(payment.pk),
        "paymentToken": payment_status_token,
    }
    return urlunsplit((parts.scheme, parts.netloc, path, urlencode(query_params), ""))


def _create_subscription_checkout_payload(
    payment: SubscriptionPayment,
    *,
    locale: str | None,
    payment_status_token: str,
) -> PaymentCheckoutPayload:
    public_key = settings.LIQPAY_PUBLIC_KEY
    if not public_key:
        raise PaymentProviderConfigurationError("LIQPAY_PUBLIC_KEY is not configured")

    provider_order_id = f"bloomify-subpay-{payment.pk}"
    payment.provider_order_id = provider_order_id
    payment.save(update_fields=["provider_order_id"])

    payload: JsonObject = {
        "version": 7,
        "public_key": public_key,
        "action": "pay",
        "amount": str(payment.amount),
        "currency": "UAH",
        "description": f"Bloomify {payment.subscription.plan.name} subscription",
        "order_id": provider_order_id,
        "result_url": _build_subscription_result_url(
            payment,
            locale=locale,
            payment_status_token=payment_status_token,
        ),
        "sandbox": 1 if public_key.startswith("sandbox_") else 0,
    }

    subscription_server_url = settings.LIQPAY_SUBSCRIPTION_SERVER_URL
    if subscription_server_url:
        payload["server_url"] = subscription_server_url
    elif settings.LIQPAY_SERVER_URL:
        parts = urlsplit(settings.LIQPAY_SERVER_URL)
        payload["server_url"] = urlunsplit(
            (
                parts.scheme,
                parts.netloc,
                settings.LIQPAY_SUBSCRIPTION_CALLBACK_PATH,
                "",
                "",
            )
        )

    data = encode_data(payload)
    return {
        "checkoutUrl": settings.LIQPAY_CHECKOUT_URL,
        "data": data,
        "signature": create_signature(data),
    }


class SubscriptionPlanListView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={200: SubscriptionPlanSerializer(many=True)})
    def get(self, request: Request) -> Response:
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by("price")
        serializer = SubscriptionPlanSerializer(
            plans, many=True, context={"request": request}
        )
        return Response(serializer.data)


class MySubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses={200: SubscriptionSerializer})
    def get(self, request: Request) -> Response:
        user = request.user
        if not isinstance(user, User):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        subscription = (
            Subscription.objects.filter(user=user)
            .exclude(status="canceled")
            .select_related("plan")
            .order_by("-created_at")
            .first()
        )
        if subscription is None:
            return Response(
                {"detail": "No active subscription."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(
            SubscriptionSerializer(subscription, context={"request": request}).data
        )


class SubscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "subscription"

    @extend_schema(request=SubscribeRequestSerializer, responses={201: dict})
    def post(self, request: Request) -> Response:
        user = request.user
        if not isinstance(user, User):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        serializer = SubscribeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan: SubscriptionPlan = serializer.validated_data["plan_id"]

        locale = request.data.get("locale") or request.query_params.get("locale")
        if isinstance(locale, str) and locale not in SUPPORTED_LANGUAGE_CODES:
            locale = None

        payment_status_token = create_order_access_token()

        with transaction.atomic():
            existing = (
                Subscription.objects.select_for_update()
                .filter(user=user)
                .exclude(status="canceled")
                .first()
            )
            if existing is not None:
                return Response(
                    {"detail": "You already have an active subscription."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            subscription = Subscription.objects.create(
                user=user,
                plan=plan,
                status="pending",
                start_date=date.today(),
            )
            payment = SubscriptionPayment.objects.create(
                subscription=subscription,
                amount=plan.price,
                status="pending",
                payment_status_token_hash=hash_order_access_token(payment_status_token),
            )

        try:
            checkout_payload = _create_subscription_checkout_payload(
                payment,
                locale=locale,
                payment_status_token=payment_status_token,
            )
        except PaymentProviderConfigurationError as exc:
            with transaction.atomic():
                subscription.status = "canceled"
                subscription.save(update_fields=["status"])
                payment.status = "failed"
                payment.save(update_fields=["status"])
            return Response(
                {"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response(
            {
                "subscriptionId": subscription.pk,
                "paymentId": payment.pk,
                "status": subscription.status,
                "liqpay": checkout_payload,
            },
            status=status.HTTP_201_CREATED,
        )


class UnsubscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "subscription"

    def post(self, request: Request) -> Response:
        user = request.user
        if not isinstance(user, User):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        subscription = Subscription.objects.filter(user=user, status="active").first()
        if subscription is None:
            return Response(
                {"detail": "No active subscription to cancel."},
                status=status.HTTP_404_NOT_FOUND,
            )

        subscription.status = "canceled"
        subscription.end_date = date.today()
        subscription.save(update_fields=["status", "end_date"])
        return Response({"detail": "Subscription canceled."})


class UpgradeSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "subscription"

    @extend_schema(request=UpgradeRequestSerializer, responses={201: dict})
    def post(self, request: Request) -> Response:
        user = request.user
        if not isinstance(user, User):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        serializer = UpgradeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_plan: SubscriptionPlan = serializer.validated_data["plan_id"]

        subscription = (
            Subscription.objects.filter(user=user, status="active")
            .select_related("plan")
            .first()
        )
        if subscription is None:
            return Response(
                {"detail": "No active subscription to upgrade."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_plan.pk == subscription.plan.pk:
            return Response(
                {"detail": "Already on this plan."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_plan.price <= subscription.plan.price:
            return Response(
                {"detail": "Can only upgrade to a more expensive plan."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        diff_amount = target_plan.price - subscription.plan.price

        locale = request.data.get("locale") or request.query_params.get("locale")
        if isinstance(locale, str) and locale not in SUPPORTED_LANGUAGE_CODES:
            locale = None

        payment_status_token = create_order_access_token()

        with transaction.atomic():
            payment = SubscriptionPayment.objects.create(
                subscription=subscription,
                target_plan=target_plan,
                amount=diff_amount,
                status="pending",
                payment_status_token_hash=hash_order_access_token(payment_status_token),
            )

        try:
            checkout_payload = _create_subscription_checkout_payload(
                payment,
                locale=locale,
                payment_status_token=payment_status_token,
            )
        except PaymentProviderConfigurationError as exc:
            with transaction.atomic():
                payment.status = "failed"
                payment.save(update_fields=["status"])
            return Response(
                {"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response(
            {
                "subscriptionId": subscription.pk,
                "paymentId": payment.pk,
                "status": subscription.status,
                "liqpay": checkout_payload,
            },
            status=status.HTTP_201_CREATED,
        )


class SubscriptionPaymentStatusView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request: Request, pk: int) -> Response:
        token = request.query_params.get("paymentToken", "")
        try:
            payment = SubscriptionPayment.objects.select_related(
                "subscription__plan"
            ).get(pk=pk)
        except SubscriptionPayment.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if (
            not token
            or hash_order_access_token(token) != payment.payment_status_token_hash
        ):
            return Response(
                {"detail": "Invalid payment token."}, status=status.HTTP_403_FORBIDDEN
            )

        return Response(
            {
                "paymentId": payment.pk,
                "paymentStatus": payment.status,
                "subscriptionId": payment.subscription_id,
                "subscriptionStatus": payment.subscription.status,
                "plan": SubscriptionPlanSerializer(payment.subscription.plan).data,
            }
        )


class LiqPaySubscriptionCallbackView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        data = request.data.get("data")
        signature = request.data.get("signature")

        if not isinstance(data, str) or not isinstance(signature, str):
            return Response(
                {"detail": "Missing data or signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            is_valid = verify_signature(data, signature)
        except PaymentProviderConfigurationError as exc:
            logger.warning("Subscription callback signature check failed: %s", exc)
            return Response(
                {"detail": "Unable to verify signature."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not is_valid:
            return Response(
                {"detail": "Invalid signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = decode_data(data)
        except Exception:
            return Response(
                {"detail": "Invalid data payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_id = payload.get("order_id")
        if not isinstance(order_id, str) or not order_id.startswith("bloomify-subpay-"):
            return Response(
                {"detail": "Not a subscription payment."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment = SubscriptionPayment.objects.select_related(
                "subscription", "target_plan"
            ).get(provider_order_id=order_id)
        except SubscriptionPayment.DoesNotExist:
            return Response(
                {"detail": "Payment not found."}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            callback_amount = Decimal(str(payload.get("amount", "0")))
        except InvalidOperation:
            callback_amount = Decimal("0")

        callback_currency = str(payload.get("currency", "")).upper()
        if callback_amount != payment.amount or callback_currency != "UAH":
            logger.warning(
                "Subscription callback amount/currency mismatch for payment %s: "
                "expected %s UAH, got %s %s",
                payment.pk,
                payment.amount,
                callback_amount,
                callback_currency,
            )
            return Response(
                {"detail": "Amount or currency mismatch."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment_status = str(payload.get("status", "")).lower()
        paid_statuses = {"success", "sandbox"}

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
            elif payment_status in {"failure", "error", "reversed"}:
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
        return Response({"status": "ok"})
