from django import forms
from django.contrib import admin
from django.db import models
from django.utils.translation import gettext_lazy as _
from parler.admin import TranslatableAdmin, TranslatableStackedInline

from shop.models.category import (
    Category,
    CategoryContentBlock,
    get_category_translation_text,
)


class CategoryContentBlockInline(TranslatableStackedInline):
    model = CategoryContentBlock
    extra = 0
    formfield_overrides = {
        models.TextField: {"widget": forms.Textarea(attrs={"rows": 3})},
    }
    verbose_name = _("Content block (info pages)")
    verbose_name_plural = _("Content blocks (info pages)")
    fieldsets = (
        (
            None,
            {
                "fields": (("block_type", "order", "align"),),
                "description": _(
                    "Pick what this block is, its position on the page "
                    "(1, 2, 3…), and how its content is aligned."
                ),
            },
        ),
        (
            _("Heading & text"),
            {
                "fields": ("title", "heading_level", "body"),
                "description": _(
                    "Fill the heading for Heading blocks, the text for "
                    "Text blocks. Heading size: H1 largest → H6 smallest."
                ),
            },
        ),
        (
            _("Image"),
            {
                "fields": (("image",), ("image_size", "image_radius")),
                "description": _(
                    "Optional for any block type: the photo is shown after "
                    "the heading or text."
                ),
            },
        ),
    )


@admin.register(Category)
class CategoryAdmin(TranslatableAdmin):
    list_display = ("admin_name", "slug", "kind", "order", "is_active")
    list_editable = ("order", "is_active")
    list_filter = ("kind", "is_active")
    search_fields = ("slug", "translations__name")
    filter_horizontal = ("products",)
    inlines = [CategoryContentBlockInline]
    fieldsets = (
        (None, {"fields": ("name", "slug", "kind", "order", "is_active")}),
        (
            _("Bouquets (catalog pages)"),
            {
                "fields": ("products",),
                "description": _(
                    "Shown only when type is Catalog. "
                    "For Info pages use content blocks below."
                ),
            },
        ),
    )

    @admin.display(description=_("Name"))
    def admin_name(self, obj: Category) -> str:
        return get_category_translation_text(obj, "name") or obj.slug
