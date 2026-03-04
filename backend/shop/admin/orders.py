from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from shop.models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_per_page = 10
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
    search_fields = ("user__username", "user__email", "product__translations__name")
    autocomplete_fields = ("user", "product")
    ordering = ("-created_at",)

    @admin.display(description=_("Total price"))
    def total_price_display(self, obj: Order) -> str:
        return str(obj.total_price)
