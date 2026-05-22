from shop.models.site_language_settings import SiteLanguageSettings


def get_site_languages_settings() -> SiteLanguageSettings:
    settings_obj, _ = SiteLanguageSettings.objects.get_or_create(pk=1)
    return settings_obj
