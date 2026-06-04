from decimal import Decimal
from typing import TYPE_CHECKING

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from shop.types import JsonObject

from .product import Product


class Order(models.Model):
    if TYPE_CHECKING:
        id: int
        product_id: int | None
        items: models.Manager["OrderItem"]

        def get_status_display(self) -> str: ...

        def get_payment_method_display(self) -> str: ...

        def get_payment_status_display(self) -> str: ...

    STATUS_CHOICES = [
        ("pending", _("Pending payment")),
        ("paid", _("Paid")),
        ("failed", _("Failed")),
        ("fulfilled", _("Fulfilled")),
        ("canceled", _("Canceled")),
    ]
    PAYMENT_STATUS_CHOICES = [
        ("not_required", _("Not required")),
        ("pending", _("Pending")),
        ("paid", _("Paid")),
        ("failed", _("Failed")),
        ("canceled", _("Canceled")),
    ]
    PAYMENT_METHOD_CHOICES = [
        ("apple_pay", _("Apple Pay")),
        ("google_pay", _("Google Pay")),
        ("card", _("Card")),
        ("cash_on_delivery", _("Payment on delivery")),
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
        null=True,
        blank=True,
        verbose_name=_("Bouquet"),
    )
    quantity = models.PositiveIntegerField(_("Quantity"), default=1)
    status: "models.CharField[str, str]" = models.CharField(
        _("Status"), max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    customer_name: "models.CharField[str, str]" = models.CharField(
        _("Customer name"), max_length=200, blank=True
    )
    customer_email: "models.EmailField[str, str]" = models.EmailField(
        _("Customer email"), blank=True
    )
    customer_phone: "models.CharField[str, str]" = models.CharField(
        _("Customer phone"), max_length=40, blank=True
    )
    delivery_city: "models.CharField[str, str]" = models.CharField(
        _("Delivery city"), max_length=120, blank=True
    )
    delivery_address: "models.CharField[str, str]" = models.CharField(
        _("Delivery address"), max_length=255, blank=True
    )
    delivery_note: "models.TextField[str, str]" = models.TextField(
        _("Delivery note"), blank=True
    )
    payment_provider: "models.CharField[str, str]" = models.CharField(
        _("Payment provider"), max_length=40, blank=True
    )
    payment_method: "models.CharField[str, str]" = models.CharField(
        _("Payment method"),
        max_length=32,
        choices=PAYMENT_METHOD_CHOICES,
        blank=True,
    )
    payment_status: "models.CharField[str, str]" = models.CharField(
        _("Payment status"),
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default="pending",
    )
    liqpay_order_id: "models.CharField[str | None, str | None]" = models.CharField(
        _("LiqPay order id"), max_length=80, blank=True, unique=True, null=True
    )
    liqpay_payment_id: "models.CharField[str, str]" = models.CharField(
        _("LiqPay payment id"), max_length=120, blank=True
    )
    subtotal: "models.DecimalField[Decimal, Decimal]" = models.DecimalField(
        _("Subtotal"), max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    delivery_cost: "models.DecimalField[Decimal, Decimal]" = models.DecimalField(
        _("Delivery cost"), max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    total: "models.DecimalField[Decimal, Decimal]" = models.DecimalField(
        _("Total"), max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    payment_payload: "models.JSONField[JsonObject, JsonObject]" = models.JSONField(
        _("Payment payload"), default=dict, blank=True
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
        if self.total:
            return self.total
        if not self.product_id:
            return Decimal("0.00")
        assert self.product is not None
        return self.product.price * self.quantity


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("Order"),
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items",
        verbose_name=_("Bouquet"),
    )
    quantity = models.PositiveIntegerField(_("Quantity"), default=1)
    unit_price = models.DecimalField(_("Unit price"), max_digits=10, decimal_places=2)
    total = models.DecimalField(_("Total"), max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]
        verbose_name = _("Order item")
        verbose_name_plural = _("Order items")

    def __str__(self) -> str:
        return f"{self.product} x {self.quantity}"
