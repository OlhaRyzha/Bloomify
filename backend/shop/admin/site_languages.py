from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from shop.models.site_language_settings import SiteLanguageSettings


@admin.register(SiteLanguageSettings)
class SiteLanguageSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        (
            _("Enabled site languages"),
            {
                "fields": (
                    "enable_uk",
                    "enable_en",
                    "enable_pl",
                )
            },
        ),
    )

    def changelist_view(self, request, extra_context=None):
        settings_obj, _ = SiteLanguageSettings.objects.get_or_create(pk=1)
        change_url = reverse(
            "admin:shop_sitelanguagesettings_change", args=[settings_obj.pk]
        )
        return HttpResponseRedirect(change_url)

    def has_add_permission(self, request):
        return not SiteLanguageSettings.objects.exists()
