import secrets
import string
from decimal import Decimal

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

_PROMO_ALPHABET = string.ascii_uppercase + string.digits
_PROMO_ALPHABET = _PROMO_ALPHABET.translate(str.maketrans("", "", "IO01"))
PROMO_CODE_LENGTH = 8


def generate_promo_code() -> str:
    return "".join(secrets.choice(_PROMO_ALPHABET) for _ in range(PROMO_CODE_LENGTH))


class PromoCode(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ("percentage", _("Percentage (%)")),
        ("fixed", _("Fixed amount (₴)")),
    ]

    code = models.CharField(
        _("Code"),
        max_length=PROMO_CODE_LENGTH,
        unique=True,
        db_index=True,
    )
    discount_type = models.CharField(
        _("Discount type"),
        max_length=20,
        choices=DISCOUNT_TYPE_CHOICES,
    )
    discount_value = models.DecimalField(
        _("Discount value"),
        max_digits=10,
        decimal_places=2,
    )
    is_active = models.BooleanField(_("Active"), default=True)
    max_uses = models.PositiveIntegerField(_("Max uses"), null=True, blank=True)
    used_count = models.PositiveIntegerField(_("Used count"), default=0, editable=False)
    valid_from = models.DateTimeField(_("Valid from"), null=True, blank=True)
    valid_until = models.DateTimeField(_("Valid until"), null=True, blank=True)
    created_at = models.DateTimeField(_("Created"), auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Promo code")
        verbose_name_plural = _("Promo codes")

    def __str__(self) -> str:
        return self.code

    def is_valid(self) -> bool:
        if not self.is_active:
            return False
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False
        now = timezone.now()
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        return True

    def calculate_discount(self, subtotal: Decimal) -> Decimal:
        if self.discount_type == "percentage":
            amount = (subtotal * self.discount_value / 100).quantize(Decimal("0.01"))
        else:
            amount = self.discount_value
        return min(amount, subtotal)
