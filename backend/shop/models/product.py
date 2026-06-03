from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import BooleanField, DateTimeField, DecimalField
from django.utils.translation import gettext_lazy as _
from parler.models import TranslatableModel, TranslatedFields


def get_product_translation_text(
    product: "Product",
    field_name: str,
    *,
    language_code: str | None = None,
) -> str:
    value = product.safe_translation_getter(
        field_name,
        language_code=language_code,
        any_language=True,
    )
    return value if isinstance(value, str) else ""


class Product(TranslatableModel):
    if TYPE_CHECKING:
        id: int
        name: str

    translations = TranslatedFields(
        name=models.CharField(_("Name"), max_length=200),
        description=models.TextField(_("Description"), blank=True),
        tag=models.CharField(_("Tag"), max_length=50, blank=True),
    )

    price: "DecimalField[Decimal, Decimal]" = models.DecimalField(
        _("Price"), max_digits=10, decimal_places=2
    )
    image = models.ImageField(_("Image"), upload_to="products/", blank=True, null=True)
    is_active: "BooleanField[bool, bool]" = models.BooleanField(
        _("Active"), default=True
    )
    created_at: "DateTimeField[datetime, datetime]" = models.DateTimeField(
        _("Created"), auto_now_add=True
    )
    updated_at: "DateTimeField[datetime, datetime]" = models.DateTimeField(
        _("Updated"), auto_now=True
    )

    class Meta:
        ordering = ["translations__name"]
        verbose_name = _("Bouquet")
        verbose_name_plural = _("Bouquets")

    def __str__(self) -> str:
        return get_product_translation_text(self, "name") or f"Product {self.pk}"
