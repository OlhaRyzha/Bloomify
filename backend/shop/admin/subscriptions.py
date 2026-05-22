from django.contrib import admin

from shop.models.subscription import Subscription, SubscriptionPlan


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_per_page = 10
    list_display = ("name", "price", "interval", "is_active")
    list_filter = ("interval", "is_active")
    search_fields = ("name", "description")
    ordering = ("name",)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_per_page = 10
    list_display = ("user", "plan", "status", "start_date", "end_date")
    list_filter = ("status", "plan")
    search_fields = ("user__username", "user__email", "plan__name")
    autocomplete_fields = ("user", "plan")
    ordering = ("-created_at",)
