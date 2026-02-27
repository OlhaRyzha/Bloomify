from django import forms
from django.contrib import admin
from django.db import models
from django.templatetags.static import static
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import Order, Product, Subscription, SubscriptionPlan


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    formfield_overrides = {
        models.TextField: {"widget": forms.Textarea(attrs={"rows": 4})},
    }
    list_display = (
        "name",
        "image_thumb",
        "price",
        "tag",
        "is_active",
        "updated_at",
        "row_actions",
    )
    list_filter = ("is_active", "tag")
    search_fields = ("name", "description")
    ordering = ("name",)
    readonly_fields = ("image_preview",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "name",
                    "description",
                    "price",
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
        return format_html(
            '<img class="bloomify-thumb" src="{}" alt="{}">',
            obj.image.url,
            obj.name,
        )

    @admin.display(description=_("Preview"))
    def image_preview(self, obj: Product) -> str:
        if not obj.image:
            return _("Image is not uploaded yet.")
        return format_html(
            '<img class="bloomify-preview" src="{}" alt="{}">',
            obj.image.url,
            obj.name,
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


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "interval", "is_active")
    list_filter = ("interval", "is_active")
    search_fields = ("name", "description")
    ordering = ("name",)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "status", "start_date", "end_date")
    list_filter = ("status", "plan")
    search_fields = ("user__username", "user__email", "plan__name")
    autocomplete_fields = ("user", "plan")
    ordering = ("-created_at",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "product",
        "quantity",
        "total_price_display",
        "status",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("user__username", "user__email", "product__name")
    autocomplete_fields = ("user", "product")
    ordering = ("-created_at",)

    @admin.display(description=_("Total price"))
    def total_price_display(self, obj: Order) -> str:
        return str(obj.total_price)
