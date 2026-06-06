from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0007_remove_legacy_order_product_quantity"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="payment_status_token_hash",
            field=models.CharField(
                blank=True,
                editable=False,
                max_length=64,
                verbose_name="Payment status token hash",
            ),
        ),
    ]
