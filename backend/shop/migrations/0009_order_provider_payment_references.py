from django.db import migrations, models


def copy_liqpay_references_to_provider_fields(apps, schema_editor):
    order_model = apps.get_model("shop", "Order")
    order_model.objects.filter(
        provider_order_id__isnull=True,
        liqpay_order_id__isnull=False,
    ).update(provider_order_id=models.F("liqpay_order_id"))
    order_model.objects.filter(
        provider_payment_id="",
        liqpay_payment_id__gt="",
    ).update(provider_payment_id=models.F("liqpay_payment_id"))


def clear_provider_references(apps, schema_editor):
    order_model = apps.get_model("shop", "Order")
    order_model.objects.update(provider_order_id=None, provider_payment_id="")


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0008_order_payment_status_token_hash"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="provider_order_id",
            field=models.CharField(
                blank=True,
                max_length=120,
                null=True,
                unique=True,
                verbose_name="Provider order id",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="provider_payment_id",
            field=models.CharField(
                blank=True,
                max_length=120,
                verbose_name="Provider payment id",
            ),
        ),
        migrations.RunPython(
            copy_liqpay_references_to_provider_fields,
            clear_provider_references,
        ),
    ]
