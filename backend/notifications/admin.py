from django.contrib import admin

from notifications.models import TelegramOrderSubscription


@admin.register(TelegramOrderSubscription)
class TelegramOrderSubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "telegram_chat_id",
        "telegram_username",
        "is_active",
        "last_notified_status",
        "last_notified_payment_status",
        "created_at",
    )
    list_filter = ("is_active", "created_at", "updated_at")
    search_fields = (
        "order__id",
        "telegram_chat_id",
        "telegram_username",
        "first_name",
    )
    autocomplete_fields = ("order",)
    readonly_fields = ("created_at", "updated_at")
