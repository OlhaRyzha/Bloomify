from django.db import models
from django.db.models import BooleanField, DateTimeField, DecimalField
from django.utils.translation import gettext_lazy as _
from parler.models import TranslatableModel, TranslatedFields


class Product(TranslatableModel):
    translations = TranslatedFields(
        name=models.CharField(_("Name"), max_length=200),
        description=models.TextField(_("Description"), blank=True),
        tag=models.CharField(_("Tag"), max_length=50, blank=True),
    )

    price: DecimalField = models.DecimalField(
        _("Price"), max_digits=10, decimal_places=2
    )
    image = models.ImageField(_("Image"), upload_to="products/", blank=True, null=True)
    is_active: BooleanField = models.BooleanField(_("Active"), default=True)
    created_at: DateTimeField = models.DateTimeField(_("Created"), auto_now_add=True)
    updated_at: DateTimeField = models.DateTimeField(_("Updated"), auto_now=True)

    class Meta:
        ordering = ["translations__name"]
        verbose_name = _("Bouquet")
        verbose_name_plural = _("Bouquets")

    def __str__(self) -> str:
        return (
            self.safe_translation_getter("name", any_language=True)
            or f"Product {self.pk}"
        )
