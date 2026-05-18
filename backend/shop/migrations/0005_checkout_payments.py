import decimal

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0004_seed_default_roles"),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="product",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="orders",
                to="shop.product",
                verbose_name="Bouquet",
            ),
        ),
        migrations.AlterField(
            model_name="order",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending payment"),
                    ("paid", "Paid"),
                    ("failed", "Failed"),
                    ("fulfilled", "Fulfilled"),
                    ("canceled", "Canceled"),
                ],
                default="pending",
                max_length=20,
                verbose_name="Status",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="customer_name",
            field=models.CharField(
                blank=True, max_length=200, verbose_name="Customer name"
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="customer_email",
            field=models.EmailField(
                blank=True, max_length=254, verbose_name="Customer email"
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="customer_phone",
            field=models.CharField(
                blank=True, max_length=40, verbose_name="Customer phone"
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="delivery_city",
            field=models.CharField(
                blank=True, max_length=120, verbose_name="Delivery city"
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="delivery_address",
            field=models.CharField(
                blank=True, max_length=255, verbose_name="Delivery address"
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="delivery_note",
            field=models.TextField(blank=True, verbose_name="Delivery note"),
        ),
        migrations.AddField(
            model_name="order",
            name="payment_provider",
            field=models.CharField(
                blank=True, max_length=40, verbose_name="Payment provider"
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="payment_method",
            field=models.CharField(
                blank=True,
                choices=[
                    ("apple_pay", "Apple Pay"),
                    ("google_pay", "Google Pay"),
                    ("card", "Card"),
                    ("cash_on_delivery", "Payment on delivery"),
                ],
                max_length=32,
                verbose_name="Payment method",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="payment_status",
            field=models.CharField(
                choices=[
                    ("not_required", "Not required"),
                    ("pending", "Pending"),
                    ("paid", "Paid"),
                    ("failed", "Failed"),
                    ("canceled", "Canceled"),
                ],
                default="pending",
                max_length=20,
                verbose_name="Payment status",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="liqpay_order_id",
            field=models.CharField(
                blank=True,
                max_length=80,
                null=True,
                unique=True,
                verbose_name="LiqPay order id",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="liqpay_payment_id",
            field=models.CharField(
                blank=True, max_length=120, verbose_name="LiqPay payment id"
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="subtotal",
            field=models.DecimalField(
                decimal_places=2,
                default=decimal.Decimal("0.00"),
                max_digits=10,
                verbose_name="Subtotal",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="delivery_cost",
            field=models.DecimalField(
                decimal_places=2,
                default=decimal.Decimal("0.00"),
                max_digits=10,
                verbose_name="Delivery cost",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="total",
            field=models.DecimalField(
                decimal_places=2,
                default=decimal.Decimal("0.00"),
                max_digits=10,
                verbose_name="Total",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="payment_payload",
            field=models.JSONField(
                blank=True, default=dict, verbose_name="Payment payload"
            ),
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "quantity",
                    models.PositiveIntegerField(default=1, verbose_name="Quantity"),
                ),
                (
                    "unit_price",
                    models.DecimalField(
                        decimal_places=2, max_digits=10, verbose_name="Unit price"
                    ),
                ),
                (
                    "total",
                    models.DecimalField(
                        decimal_places=2, max_digits=10, verbose_name="Total"
                    ),
                ),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="shop.order",
                        verbose_name="Order",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="order_items",
                        to="shop.product",
                        verbose_name="Bouquet",
                    ),
                ),
            ],
            options={
                "verbose_name": "Order item",
                "verbose_name_plural": "Order items",
                "ordering": ["id"],
            },
        ),
    ]
