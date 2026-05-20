from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from shop.models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    autocomplete_fields = ("product",)
    fields = ("product", "quantity", "unit_price", "total")
    readonly_fields = ("unit_price", "total")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    inlines = (OrderItemInline,)
    list_per_page = 10
    list_display = (
        "id",
        "customer_display",
        "payment_method",
        "payment_status",
        "total_price_display",
        "status",
        "created_at",
    )
    list_filter = ("status", "payment_status", "payment_method", "created_at")
    search_fields = (
        "user__username",
        "user__email",
        "customer_name",
        "customer_email",
        "customer_phone",
        "product__translations__name",
        "items__product__translations__name",
        "liqpay_order_id",
        "liqpay_payment_id",
    )
    autocomplete_fields = ("user", "product")
    ordering = ("-created_at",)
    readonly_fields = (
        "subtotal",
        "delivery_cost",
        "total",
        "payment_payload",
        "created_at",
        "updated_at",
    )

    @admin.display(description=_("Customer"))
    def customer_display(self, obj: Order) -> str:
        return obj.customer_name or obj.customer_email or str(obj.user or "")

    @admin.display(description=_("Total price"))
    def total_price_display(self, obj: Order) -> str:
        return str(obj.total_price)
