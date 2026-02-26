from decimal import Decimal

from django.conf import settings
from django.db import models


class Product(models.Model):
    name = models.CharField("Назва", max_length=200)
    description = models.TextField("Опис", blank=True)
    price = models.DecimalField("Ціна", max_digits=10, decimal_places=2)
    image = models.ImageField(
        "Зображення", upload_to="products/", blank=True, null=True
    )
    tag = models.CharField("Тег", max_length=50, blank=True)
    is_active = models.BooleanField("Активний", default=True)
    created_at = models.DateTimeField("Створено", auto_now_add=True)
    updated_at = models.DateTimeField("Оновлено", auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Букет"
        verbose_name_plural = "Букети"

    def __str__(self) -> str:
        return self.name


class SubscriptionPlan(models.Model):
    INTERVAL_CHOICES = [
        ("weekly", "Щотижневий"),
        ("monthly", "Щомісячний"),
        ("quarterly", "Щоквартальний"),
    ]

    name = models.CharField("Назва", max_length=200)
    description = models.TextField("Опис", blank=True)
    price = models.DecimalField("Ціна", max_digits=10, decimal_places=2)
    interval = models.CharField("Інтервал", max_length=20, choices=INTERVAL_CHOICES)
    is_active = models.BooleanField("Активний", default=True)
    created_at = models.DateTimeField("Створено", auto_now_add=True)
    updated_at = models.DateTimeField("Оновлено", auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "План підписки"
        verbose_name_plural = "Плани підписки"

    def __str__(self) -> str:
        return self.name


class Subscription(models.Model):
    STATUS_CHOICES = [
        ("active", "Активна"),
        ("paused", "Призупинена"),
        ("canceled", "Скасована"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
        verbose_name="Користувач",
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="subscriptions",
        verbose_name="План",
    )
    status = models.CharField(
        "Статус", max_length=20, choices=STATUS_CHOICES, default="active"
    )
    start_date = models.DateField("Дата початку")
    end_date = models.DateField("Дата завершення", blank=True, null=True)
    created_at = models.DateTimeField("Створено", auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Підписка"
        verbose_name_plural = "Підписки"

    def __str__(self) -> str:
        return f"{self.user} - {self.plan}"


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Очікує оплати"),
        ("paid", "Оплачено"),
        ("fulfilled", "Виконано"),
        ("canceled", "Скасовано"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
        verbose_name="Користувач",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="orders",
        verbose_name="Букет",
    )
    quantity = models.PositiveIntegerField("Кількість", default=1)
    status = models.CharField(
        "Статус", max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    created_at = models.DateTimeField("Створено", auto_now_add=True)
    updated_at = models.DateTimeField("Оновлено", auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Замовлення"
        verbose_name_plural = "Замовлення"

    def __str__(self) -> str:
        return f"Замовлення №{self.pk}"

    @property
    def total_price(self) -> Decimal:
        return self.product.price * self.quantity
