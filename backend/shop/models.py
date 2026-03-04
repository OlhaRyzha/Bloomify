from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import BooleanField, DateTimeField, DecimalField
from django.utils.translation import gettext_lazy as _
from parler.models import TranslatableModel, TranslatedFields


class Product(TranslatableModel):
    translations = TranslatedFields(
        name=models.CharField(_("Name"), max_length=200),
        description=models.TextField(_("Description"), blank=True),
        tag=models.CharField(_("Tag"), max_length=50, blank=True),
    )

    price: DecimalField = models.DecimalField(
        _("Price"), max_digits=10, decimal_places=2
    )
    image = models.ImageField(_("Image"), upload_to="products/", blank=True, null=True)
    is_active: BooleanField = models.BooleanField(_("Active"), default=True)
    created_at: DateTimeField = models.DateTimeField(_("Created"), auto_now_add=True)
    updated_at: DateTimeField = models.DateTimeField(_("Updated"), auto_now=True)

    class Meta:
        ordering = ["translations__name"]
        verbose_name = _("Bouquet")
        verbose_name_plural = _("Bouquets")

    def __str__(self) -> str:
        return (
            self.safe_translation_getter("name", any_language=True)
            or f"Product {self.pk}"
        )


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


class SiteLanguageSettings(models.Model):
    enable_uk = models.BooleanField(_("Enable Ukrainian"), default=True)
    enable_en = models.BooleanField(_("Enable English"), default=True)
    enable_pl = models.BooleanField(_("Enable Polish"), default=True)
    updated_at = models.DateTimeField(_("Updated"), auto_now=True)

    class Meta:
        verbose_name = _("Site language settings")
        verbose_name_plural = _("Site language settings")

    def __str__(self) -> str:
        return str(_("Site languages"))

    @property
    def enabled_locales(self) -> list[str]:
        locales: list[str] = []
        if self.enable_uk:
            locales.append("uk")
        if self.enable_en:
            locales.append("en")
        if self.enable_pl:
            locales.append("pl")
        return locales or ["uk"]


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", _("Pending payment")),
        ("paid", _("Paid")),
        ("fulfilled", _("Fulfilled")),
        ("canceled", _("Canceled")),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
        verbose_name=_("User"),
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="orders",
        verbose_name=_("Bouquet"),
    )
    quantity = models.PositiveIntegerField(_("Quantity"), default=1)
    status = models.CharField(
        _("Status"), max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    created_at = models.DateTimeField(_("Created"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated"), auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")

    def __str__(self) -> str:
        return _("Order №%(id)s") % {"id": self.pk}

    @property
    def total_price(self) -> Decimal:
        return self.product.price * self.quantity
