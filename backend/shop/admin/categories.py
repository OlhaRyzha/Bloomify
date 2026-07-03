from django import forms
from django.contrib import admin
from django.db import models
from django.utils.translation import gettext_lazy as _
from parler.admin import TranslatableAdmin, TranslatableTabularInline

from shop.models.category import (
    Category,
    CategoryContentBlock,
    get_category_translation_text,
)


class CategoryContentBlockInline(TranslatableTabularInline):
    model = CategoryContentBlock
    extra = 1
    fields = ("block_type", "title", "body", "image", "order")
    formfield_overrides = {
        models.TextField: {"widget": forms.Textarea(attrs={"rows": 3})},
    }
    verbose_name = _("Content block (info pages)")
    verbose_name_plural = _("Content blocks (info pages)")


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
