from django.db import models
from django.utils.translation import gettext_lazy as _


class SiteLanguageSettings(models.Model):
    enable_uk = models.BooleanField(_("Enable Ukrainian"), default=True)
    enable_en = models.BooleanField(_("Enable English"), default=True)
    enable_pl = models.BooleanField(_("Enable Polish"), default=True)
    updated_at = models.DateTimeField(_("Updated"), auto_now=True)

    class Meta:
        verbose_name = _("Site language settings")
        verbose_name_plural = _("Site language settings")

    def __str__(self) -> str:
        return str(_("Site languages"))

    @property
    def enabled_locales(self) -> list[str]:
        locales: list[str] = []
        if self.enable_uk:
            locales.append("uk")
        if self.enable_en:
            locales.append("en")
        if self.enable_pl:
            locales.append("pl")
        return locales or ["uk"]
