from django.contrib import admin
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _

from shop.models.promo_code import PromoCode, generate_promo_code


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_per_page = 25
    list_display = (
        "code",
        "discount_type",
        "discount_value",
        "is_active",
        "used_count",
        "max_uses",
        "valid_until",
        "created_at",
    )
    list_filter = ("discount_type", "is_active")
    search_fields = ("code",)
    ordering = ("-created_at",)
    readonly_fields = ("used_count", "created_at")
    fieldsets = (
        (
            None,
            {
                "fields": ("code", "discount_type", "discount_value", "is_active"),
            },
        ),
        (
            _("Limits"),
            {
                "fields": ("max_uses", "used_count", "valid_from", "valid_until"),
            },
        ),
        (_("System"), {"fields": ("created_at",)}),
    )

    class Media:
        js = ("bloomify/admin-promo-generate.js",)

    def save_model(
        self,
        request: HttpRequest,
        obj: PromoCode,
        form: object,
        change: bool,
    ) -> None:
        obj.code = obj.code.upper().strip()
        super().save_model(request, obj, form, change)

    def get_changeform_initial_data(self, request: HttpRequest) -> dict:
        return {"code": generate_promo_code()}
