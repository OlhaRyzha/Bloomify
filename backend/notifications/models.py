from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from shop.models.order import Order


class TelegramOrderSubscription(models.Model):
    if TYPE_CHECKING:
        id: int
        order_id: int

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="telegram_subscriptions",
        verbose_name=_("Order"),
    )
    telegram_chat_id = models.CharField(_("Telegram chat id"), max_length=64)
    telegram_user_id = models.BigIntegerField(
        _("Telegram user id"),
        null=True,
        blank=True,
    )
    telegram_username = models.CharField(
        _("Telegram username"),
        max_length=64,
        blank=True,
    )
    first_name = models.CharField(_("First name"), max_length=120, blank=True)
    is_active = models.BooleanField(_("Active"), default=True)
    last_notified_status = models.CharField(
        _("Last notified order status"),
        max_length=20,
        blank=True,
    )
    last_notified_payment_status = models.CharField(
        _("Last notified payment status"),
        max_length=20,
        blank=True,
    )
    created_at = models.DateTimeField(_("Created"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated"), auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["order", "telegram_chat_id"],
                name="unique_telegram_order_subscription",
            ),
        ]
        indexes = [
            models.Index(
                fields=["telegram_chat_id", "is_active"],
                name="telegram_sub_chat_active_idx",
            ),
            models.Index(
                fields=["order", "is_active"],
                name="telegram_sub_order_active_idx",
            ),
        ]
        ordering = ["-created_at"]
        verbose_name = _("Telegram order subscription")
        verbose_name_plural = _("Telegram order subscriptions")

    def __str__(self) -> str:
        return _("Telegram subscription for order №%(order_id)s") % {
            "order_id": self.order_id,
        }
