from django.utils.translation import get_language
from rest_framework import serializers

from shop.models import Product, SiteLanguageSettings


class SiteLanguageSettingsSerializer(serializers.ModelSerializer):
    enabledLocales = serializers.SerializerMethodField()

    class Meta:
        model = SiteLanguageSettings
        fields = ("enabledLocales",)

    def get_enabledLocales(self, obj: SiteLanguageSettings) -> list[str]:
        return obj.enabled_locales


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    tag = serializers.SerializerMethodField()
    price = serializers.FloatField()
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ("id", "name", "description", "price", "imageUrl", "tag")

    def _language(self) -> str | None:
        request = self.context.get("request")
        if request:
            return request.query_params.get("lang") or get_language()
        return get_language()

    def get_name(self, obj: Product) -> str:
        return (
            obj.safe_translation_getter(
                "name", language_code=self._language(), any_language=True
            )
            or ""
        )

    def get_description(self, obj: Product) -> str:
        return (
            obj.safe_translation_getter(
                "description", language_code=self._language(), any_language=True
            )
            or ""
        )

    def get_tag(self, obj: Product) -> str:
        return (
            obj.safe_translation_getter(
                "tag", language_code=self._language(), any_language=True
            )
            or ""
        )

    def get_imageUrl(self, obj: Product) -> str | None:
        if not obj.image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url
