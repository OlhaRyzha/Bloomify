from django.contrib import admin
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _
from parler.admin import TranslatableAdmin

from shop.models.subscription import Subscription, SubscriptionPayment, SubscriptionPlan


class SubscriptionPaymentInline(admin.TabularInline):
    model = SubscriptionPayment
    extra = 0
    fields = (
        "status",
        "amount",
        "provider_order_id",
        "provider_payment_id",
        "created_at",
    )
    readonly_fields = (
        "status",
        "amount",
        "provider_order_id",
        "provider_payment_id",
        "created_at",
    )
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request: HttpRequest, obj: object = None) -> bool:
        return False


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(TranslatableAdmin):
    list_per_page = 20
    list_display = ("name", "price", "interval", "is_active", "created_at")
    list_filter = ("interval", "is_active")
    list_editable = ("is_active",)
    search_fields = ("translations__name", "translations__description")
    ordering = ("price",)
    fieldsets = (
        (_("Content"), {"fields": ("name", "description", "badge")}),
        (None, {"fields": ("price", "interval", "is_active")}),
        (_("System"), {"fields": ("created_at", "updated_at")}),
    )
    readonly_fields = ("created_at", "updated_at")


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    inlines = (SubscriptionPaymentInline,)
    list_per_page = 20
    list_display = (
        "id",
        "user",
        "plan",
        "status",
        "start_date",
        "end_date",
        "created_at",
    )
    list_filter = ("status", "plan", "created_at")
    list_editable = ("status",)
    search_fields = ("user__username", "user__email", "plan__translations__name")
    autocomplete_fields = ("user", "plan")
    ordering = ("-created_at",)
    fieldsets = (
        (
            None,
            {"fields": ("user", "plan", "status", "start_date", "end_date")},
        ),
        (_("System"), {"fields": ("created_at",)}),
    )
    readonly_fields = ("created_at",)

    def has_add_permission(self, request: HttpRequest) -> bool:
        return bool(request.user.is_superuser)

    def has_change_permission(self, request: HttpRequest, obj: object = None) -> bool:
        return bool(request.user.is_staff)

    def has_delete_permission(self, request: HttpRequest, obj: object = None) -> bool:
        return bool(request.user.is_superuser)


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_per_page = 20
    list_display = (
        "id",
        "subscription",
        "amount",
        "status",
        "provider_order_id",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = (
        "subscription__user__username",
        "subscription__user__email",
        "provider_order_id",
        "provider_payment_id",
    )
    ordering = ("-created_at",)
    readonly_fields = (
        "subscription",
        "amount",
        "provider_order_id",
        "provider_payment_id",
        "payment_payload",
        "created_at",
        "updated_at",
    )
    fieldsets = (
        (None, {"fields": ("subscription", "amount", "status")}),
        (
            _("Payment details"),
            {
                "fields": (
                    "provider_order_id",
                    "provider_payment_id",
                    "payment_payload",
                )
            },
        ),
        (_("System"), {"fields": ("created_at", "updated_at")}),
    )

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_change_permission(self, request: HttpRequest, obj: object = None) -> bool:
        return bool(request.user.is_superuser)

    def has_delete_permission(self, request: HttpRequest, obj: object = None) -> bool:
        return bool(request.user.is_superuser)
