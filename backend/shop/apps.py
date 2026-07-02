from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class ShopConfig(AppConfig):
    name = "shop"
    verbose_name = _("Store")

    def ready(self) -> None:
        import shop.signals  # noqa: F401
