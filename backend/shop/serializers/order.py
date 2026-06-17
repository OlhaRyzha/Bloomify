from django.conf import settings
from rest_framework import serializers

from shop.models.order import Order
from shop.types import CheckoutItemData


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
