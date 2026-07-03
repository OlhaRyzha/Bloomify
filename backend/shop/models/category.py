from datetime import datetime
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import BooleanField, DateTimeField
from django.utils.translation import gettext_lazy as _
from parler.models import TranslatableModel, TranslatedFields

from shop.models.product import Product


def get_category_translation_text(
    instance: "Category | CategoryContentBlock",
    field_name: str,
    *,
    language_code: str | None = None,
) -> str:
    value = instance.safe_translation_getter(
        field_name,
        language_code=language_code,
        any_language=True,
    )
    return value if isinstance(value, str) else ""


class Category(TranslatableModel):
    """Admin-managed site category shown in the main menu and footer.

    kind="catalog" pages render the selected bouquets like the catalog;
    kind="info" pages render the ordered content blocks (simple constructor).
    """

    KIND_CATALOG = "catalog"
    KIND_INFO = "info"
    KIND_CHOICES = [
        (KIND_CATALOG, _("Catalog")),
        (KIND_INFO, _("Info page")),
    ]

    if TYPE_CHECKING:
        id: int
        name: str

    translations = TranslatedFields(
        name=models.CharField(_("Name"), max_length=120),
    )

    slug: "models.SlugField[str, str]" = models.SlugField(
        _("Slug"), max_length=120, unique=True
    )
    kind: "models.CharField[str, str]" = models.CharField(
        _("Type"), max_length=10, choices=KIND_CHOICES, default=KIND_CATALOG
    )
    products: "models.ManyToManyField[Product, models.Model]" = models.ManyToManyField(
        Product,
        verbose_name=_("Bouquets"),
        blank=True,
        related_name="categories",
        help_text=_("Bouquets shown on this page (catalog type only)."),
    )
    order: "models.PositiveIntegerField[int, int]" = models.PositiveIntegerField(
        _("Menu order"), default=0
    )
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
        ordering = ["order", "id"]
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")

    def __str__(self) -> str:
        return get_category_translation_text(self, "name") or self.slug


class CategoryContentBlock(TranslatableModel):
    """One block of an info-page constructor: heading, text, or image."""

    BLOCK_HEADING = "heading"
    BLOCK_TEXT = "text"
    BLOCK_IMAGE = "image"
    BLOCK_CHOICES = [
        (BLOCK_HEADING, _("Heading")),
        (BLOCK_TEXT, _("Text")),
        (BLOCK_IMAGE, _("Image")),
    ]

    if TYPE_CHECKING:
        id: int
        category_id: int
        title: str
        body: str

    category: "models.ForeignKey[Category, Category]" = models.ForeignKey(
        Category,
        verbose_name=_("Category"),
        on_delete=models.CASCADE,
        related_name="blocks",
    )
    block_type: "models.CharField[str, str]" = models.CharField(
        _("Block type"), max_length=10, choices=BLOCK_CHOICES, default=BLOCK_TEXT
    )
    translations = TranslatedFields(
        title=models.CharField(_("Heading"), max_length=200, blank=True),
        body=models.TextField(_("Text"), blank=True),
    )
    image = models.ImageField(
        _("Image"), upload_to="categories/", blank=True, null=True
    )
    order: "models.PositiveIntegerField[int, int]" = models.PositiveIntegerField(
        _("Order"), default=0
    )

    class Meta:
        ordering = ["order", "id"]
        verbose_name = _("Content block")
        verbose_name_plural = _("Content blocks")

    def __str__(self) -> str:
        return f"{self.get_block_type_display()} #{self.pk}"
