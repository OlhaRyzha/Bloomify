from django import forms
from django.conf import settings
from django.contrib import admin
from django.db import models
from django.templatetags.static import static
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from parler.admin import TranslatableAdmin

from shop.models.product import Product, get_product_translation_text


def get_product_image_url(product: Product) -> str:
    """
    Local:
    MEDIA_URL=/media/
    products/image.png -> /media/products/image.png

    Production demo:
    MEDIA_URL=/
    products/image.png -> /products/image.png
    """
    image_name = product.image.name

    if not image_name:
        return ""

    media_url = settings.MEDIA_URL.rstrip("/")
    normalized_image_name = image_name.lstrip("/")

    if not media_url:
        return f"/{normalized_image_name}"

    return f"{media_url}/{normalized_image_name}"


@admin.register(Product)
class ProductAdmin(TranslatableAdmin):
    list_per_page = 10
    formfield_overrides = {
        models.TextField: {"widget": forms.Textarea(attrs={"rows": 4})},
    }
    list_display = (
        "name",
        "image_thumb",
        "price",
        "discount",
        "tag",
        "is_active",
        "updated_at",
        "row_actions",
    )
    list_filter = ("is_active", "translations__tag")
    search_fields = ("translations__name", "translations__description")
    ordering = ("translations__name",)
    readonly_fields = ("image_preview",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "name",
                    "description",
                    "price",
                    "discount",
                    "image",
                    "image_preview",
                    "tag",
                    "is_active",
                )
            },
        ),
    )

    @admin.display(description=_("Image"))
    def image_thumb(self, obj: Product) -> str:
        if not obj.image:
            return "—"

        image_url = get_product_image_url(obj)

        return format_html(
            '<img class="bloomify-thumb" src="{}" alt="{}">',
            image_url,
            get_product_translation_text(obj, "name"),
        )

    @admin.display(description=_("Preview"))
    def image_preview(self, obj: Product) -> str:
        if not obj.image:
            return str(_("Image is not uploaded yet."))

        image_url = get_product_image_url(obj)

        return format_html(
            '<img class="bloomify-preview" src="{}" alt="{}">',
            image_url,
            get_product_translation_text(obj, "name"),
        )

    @admin.display(description=_("Actions"))
    def row_actions(self, obj: Product) -> str:
        change_url = reverse("admin:shop_product_change", args=[obj.pk])
        delete_url = reverse("admin:shop_product_delete", args=[obj.pk])

        return format_html(
            '<div class="bloomify-row-actions">'
            '<a class="bloomify-row-action" href="{}" aria-label="{}" title="{}">'
            '<img src="{}" alt="">'
            "</a>"
            '<a class="bloomify-row-action bloomify-row-action--danger" href="{}" aria-label="{}" title="{}">'
            '<img src="{}" alt="">'
            "</a>"
            "</div>",
            change_url,
            _("Edit"),
            _("Edit"),
            static("admin/img/icon-changelink.svg"),
            delete_url,
            _("Delete"),
            _("Delete"),
            static("admin/img/icon-deletelink.svg"),
        )
