from decimal import Decimal
from typing import NotRequired, TypedDict

from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import F
from rest_framework import serializers

from shop.models.order import Order
from shop.models.product import Product
from shop.models.promo_code import PromoCode
from shop.security.order_access import (
    create_order_access_token,
    hash_order_access_token,
)
from shop.services.payment_providers import (
    PAYMENT_METHODS_WITH_PROVIDER,
    get_payment_provider,
    get_payment_provider_key_for_method,
)

STANDARD_DELIVERY_FEE = Decimal("150.00")
FREE_DELIVERY_THRESHOLD = Decimal("1500.00")


class CheckoutItemData(TypedDict):
    id: int
    quantity: int


class CheckoutOrderResult(TypedDict):
    order: Order
    payment_status_token: str


class CheckoutOrderPayload(TypedDict):
    customerName: str
    email: str
    phone: str
    city: str
    address: str
    paymentMethod: str
    items: list[CheckoutItemData]
    deliveryNote: NotRequired[str]
    locale: NotRequired[str]
    promoCode: NotRequired[str]


class CheckoutItemSerializer(serializers.Serializer):
    id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class CheckoutCreateSerializer(serializers.Serializer):
    customerName = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=40)
    city = serializers.CharField(max_length=120)
    address = serializers.CharField(max_length=255)
    deliveryNote = serializers.CharField(required=False, allow_blank=True)
    paymentMethod = serializers.ChoiceField(
        choices=[choice[0] for choice in Order.PAYMENT_METHOD_CHOICES]
    )
    locale = serializers.ChoiceField(
        choices=[language_code for language_code, _ in settings.LANGUAGES],
        required=False,
    )
    promoCode = serializers.CharField(required=False, allow_blank=True, max_length=20)
    items = CheckoutItemSerializer(many=True)

    def validate_items(self, value: list[CheckoutItemData]) -> list[CheckoutItemData]:
        if not value:
            raise serializers.ValidationError("Cart must contain at least one item.")

        return value


class PaymentStatusRequestSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=128)


def create_checkout_order(
    payload: CheckoutOrderPayload,
    *,
    user: User | None = None,
) -> CheckoutOrderResult:
    product_ids = [item["id"] for item in payload["items"]]
    products = Product.objects.in_bulk(product_ids)

    missing_ids = sorted(set(product_ids) - set(products.keys()))
    if missing_ids:
        raise serializers.ValidationError(
            {"items": f"Unknown product ids: {', '.join(map(str, missing_ids))}"}
        )

    subtotal = Decimal("0.00")
    order_items = []

    for item in payload["items"]:
        product = products[item["id"]]
        quantity = item["quantity"]
        item_total = product.price * quantity

        subtotal += item_total
        order_items.append((product, quantity, product.price, item_total))

    delivery_cost = (
        Decimal("0.00")
        if subtotal >= FREE_DELIVERY_THRESHOLD
        else STANDARD_DELIVERY_FEE
    )

    promo: PromoCode | None = None
    discount = Decimal("0.00")
    raw_promo_code = payload.get("promoCode", "")
    if raw_promo_code:
        try:
            promo = PromoCode.objects.get(code=raw_promo_code.upper().strip())
            if promo.is_valid():
                discount = promo.calculate_discount(subtotal)
        except PromoCode.DoesNotExist:
            pass

    total = subtotal + delivery_cost - discount
    payment_method = payload["paymentMethod"]
    payment_provider = get_payment_provider_key_for_method(payment_method)
    uses_payment_provider = payment_method in PAYMENT_METHODS_WITH_PROVIDER
    payment_status_token = create_order_access_token()

    with transaction.atomic():
        order = Order.objects.create(
            user=user,
            customer_name=payload["customerName"],
            customer_email=payload["email"],
            customer_phone=payload["phone"],
            delivery_city=payload["city"],
            delivery_address=payload["address"],
            delivery_note=payload.get("deliveryNote", ""),
            payment_provider=payment_provider,
            payment_method=payment_method,
            payment_status="pending" if uses_payment_provider else "not_required",
            status="pending",
            subtotal=subtotal,
            delivery_cost=delivery_cost,
            discount=discount,
            promo_code=promo,
            total=total,
            payment_status_token_hash=hash_order_access_token(payment_status_token),
        )

        if payment_provider:
            get_payment_provider(payment_provider).assign_order_reference(order)

        order.items.bulk_create(
            [
                order.items.model(
                    order=order,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    total=item_total,
                )
                for product, quantity, unit_price, item_total in order_items
            ]
        )

        if promo and discount > Decimal("0.00"):
            PromoCode.objects.filter(pk=promo.pk).update(used_count=F("used_count") + 1)

    return {
        "order": order,
        "payment_status_token": payment_status_token,
    }
