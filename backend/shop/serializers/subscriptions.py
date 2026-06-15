from django.utils.translation import get_language
from rest_framework import serializers

from shop.models.subscription import Subscription, SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = ("id", "name", "description", "price", "interval", "is_active")

    def _language(self) -> str | None:
        request = self.context.get("request")
        if request:
            return request.query_params.get("lang") or get_language()
        return get_language()

    def get_name(self, obj: SubscriptionPlan) -> str:
        return str(
            obj.safe_translation_getter(
                "name", language_code=self._language(), any_language=True
            )
            or ""
        )

    def get_description(self, obj: SubscriptionPlan) -> str:
        return str(
            obj.safe_translation_getter(
                "description", language_code=self._language(), any_language=True
            )
            or ""
        )


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = ("id", "plan", "status", "start_date", "end_date", "created_at")


class SubscribeRequestSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()

    def validate_plan_id(self, value: int) -> int:
        if not SubscriptionPlan.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Subscription plan not found.")
        return value
