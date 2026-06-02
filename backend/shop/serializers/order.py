import logging
from decimal import Decimal
from typing import Any

from django.db import transaction
from notifications.tasks import send_order_created_telegram_notification
from rest_framework import serializers

from shop.models.order import Order
from shop.models.product import Product

logger = logging.getLogger(__name__)

PAYMENT_METHODS_WITH_LIQPAY = {"apple_pay", "google_pay", "card"}
STANDARD_DELIVERY_FEE = Decimal("150.00")
FREE_DELIVERY_THRESHOLD = Decimal("1500.00")


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
    items = CheckoutItemSerializer(many=True)

    def validate_items(self, value: list[dict[str, int]]) -> list[dict[str, int]]:
        if not value:
            raise serializers.ValidationError("Cart must contain at least one item.")

        return value


def send_order_created_notification_safely(order_id: int) -> None:
    try:
        send_order_created_telegram_notification.delay(order_id)
    except Exception:
        logger.exception("Failed to enqueue order created Telegram notification")


def create_checkout_order(payload: dict[str, Any]) -> Order:
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

    total = subtotal + delivery_cost
    payment_method = payload["paymentMethod"]
    uses_liqpay = payment_method in PAYMENT_METHODS_WITH_LIQPAY

    order = Order.objects.create(
        customer_name=payload["customerName"],
        customer_email=payload["email"],
        customer_phone=payload["phone"],
        delivery_city=payload["city"],
        delivery_address=payload["address"],
        delivery_note=payload.get("deliveryNote", ""),
        payment_provider="liqpay" if uses_liqpay else "",
        payment_method=payment_method,
        payment_status="pending" if uses_liqpay else "not_required",
        status="pending",
        subtotal=subtotal,
        delivery_cost=delivery_cost,
        total=total,
    )

    order.liqpay_order_id = f"bloomify-{order.pk}"
    order.save(update_fields=["liqpay_order_id"])

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

    transaction.on_commit(lambda: send_order_created_notification_safely(order.id))

    return order
