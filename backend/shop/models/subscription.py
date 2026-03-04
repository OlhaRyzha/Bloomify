from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class SubscriptionPlan(models.Model):
    INTERVAL_CHOICES = [
        ("weekly", _("Weekly")),
        ("monthly", _("Monthly")),
        ("quarterly", _("Quarterly")),
    ]

    name = models.CharField(_("Name"), max_length=200)
    description = models.TextField(_("Description"), blank=True)
    price = models.DecimalField(_("Price"), max_digits=10, decimal_places=2)
    interval = models.CharField(_("Interval"), max_length=20, choices=INTERVAL_CHOICES)
    is_active = models.BooleanField(_("Active"), default=True)
    created_at = models.DateTimeField(_("Created"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated"), auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = _("Subscription plan")
        verbose_name_plural = _("Subscription plans")

    def __str__(self) -> str:
        return self.name


class Subscription(models.Model):
    STATUS_CHOICES = [
        ("active", _("Active")),
        ("paused", _("Paused")),
        ("canceled", _("Canceled")),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
        verbose_name=_("User"),
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="subscriptions",
        verbose_name=_("Plan"),
    )
    status = models.CharField(
        _("Status"), max_length=20, choices=STATUS_CHOICES, default="active"
    )
    start_date = models.DateField(_("Start date"))
    end_date = models.DateField(_("End date"), blank=True, null=True)
    created_at = models.DateTimeField(_("Created"), auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Subscription")
        verbose_name_plural = _("Subscriptions")

    def __str__(self) -> str:
        return f"{self.user} - {self.plan}"
