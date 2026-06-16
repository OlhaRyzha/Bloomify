from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from parler.models import TranslatableModel, TranslatedFields


class SubscriptionPlan(TranslatableModel):
    INTERVAL_CHOICES = [
        ("weekly", _("Weekly")),
        ("monthly", _("Monthly")),
        ("quarterly", _("Quarterly")),
    ]

    translations = TranslatedFields(
        name=models.CharField(_("Name"), max_length=200),
        description=models.TextField(_("Description"), blank=True),
        badge=models.CharField(_("Badge"), max_length=50, blank=True, default=""),
    )

    price = models.DecimalField(_("Price"), max_digits=10, decimal_places=2)
    interval = models.CharField(_("Interval"), max_length=20, choices=INTERVAL_CHOICES)
    is_active = models.BooleanField(_("Active"), default=True)
    created_at = models.DateTimeField(_("Created"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated"), auto_now=True)

    class Meta:
        ordering = ["translations__name"]
        verbose_name = _("Subscription plan")
        verbose_name_plural = _("Subscription plans")

    def __str__(self) -> str:
        return self.safe_translation_getter("name", any_language=True) or ""


class Subscription(models.Model):
    STATUS_CHOICES = [
        ("pending", _("Pending")),
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


class SubscriptionPayment(models.Model):
    STATUS_CHOICES = [
        ("pending", _("Pending")),
        ("paid", _("Paid")),
        ("failed", _("Failed")),
        ("canceled", _("Canceled")),
    ]

    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name=_("Subscription"),
    )
    target_plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="upgrade_payments",
        verbose_name=_("Target plan"),
    )
    amount = models.DecimalField(
        _("Amount"), max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    status = models.CharField(
        _("Status"), max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    provider_order_id = models.CharField(
        _("Provider order ID"),
        max_length=100,
        blank=True,
        null=True,
        default=None,
        unique=True,
    )
    provider_payment_id = models.CharField(
        _("Provider payment ID"), max_length=100, blank=True, default=""
    )
    payment_payload = models.JSONField(_("Payment payload"), default=dict, blank=True)
    payment_status_token_hash = models.CharField(
        _("Payment status token hash"), max_length=64, blank=True, default=""
    )
    created_at = models.DateTimeField(_("Created"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated"), auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Subscription payment")
        verbose_name_plural = _("Subscription payments")

    def __str__(self) -> str:
        return f"{self.subscription} – {self.amount} UAH ({self.status})"
