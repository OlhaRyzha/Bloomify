from rest_framework import serializers

from shop.models.site_language_settings import SiteLanguageSettings


class SiteLanguageSettingsSerializer(serializers.ModelSerializer):
    enabledLocales = serializers.SerializerMethodField()

    class Meta:
        model = SiteLanguageSettings
        fields = ("enabledLocales",)

    def get_enabledLocales(self, obj: SiteLanguageSettings) -> list[str]:
        return obj.enabled_locales
