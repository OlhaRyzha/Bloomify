from django.contrib import admin
from django.db import transaction
from django.forms import ModelForm
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _
from notifications.customer_bot import notify_customer_order_subscribers

from shop.models.order import Order, OrderItem


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
    list_editable = ("status",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "user",
                    "product",
                    "quantity",
                    "status",
                    "status_note",
                    "payment_method",
                    "payment_status",
                )
            },
        ),
        (
            _("Customer and delivery"),
            {
                "fields": (
                    "customer_name",
                    "customer_email",
                    "customer_phone",
                    "delivery_city",
                    "delivery_address",
                    "delivery_note",
                )
            },
        ),
        (
            _("Payment details"),
            {
                "fields": (
                    "payment_provider",
                    "liqpay_order_id",
                    "liqpay_payment_id",
                    "subtotal",
                    "delivery_cost",
                    "total",
                    "payment_payload",
                )
            },
        ),
        (_("System"), {"fields": ("created_at", "updated_at")}),
    )
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

    def save_model(
        self,
        request: HttpRequest,
        obj: Order,
        form: "ModelForm[Order]",
        change: bool,
    ) -> None:
        should_notify_customer = False
        if change and obj.pk:
            previous = Order.objects.only(
                "status",
                "status_note",
                "payment_status",
            ).get(pk=obj.pk)
            should_notify_customer = (
                previous.status != obj.status
                or previous.status_note != obj.status_note
                or previous.payment_status != obj.payment_status
            )

        super().save_model(request, obj, form, change)

        if should_notify_customer:
            order_id = obj.pk
            transaction.on_commit(
                lambda: notify_customer_order_subscribers(
                    Order.objects.get(pk=order_id)
                )
            )
