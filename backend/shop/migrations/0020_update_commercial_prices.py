from decimal import Decimal

from django.db import migrations

PLAN_PRICES = {
    "Base": Decimal("2490.00"),
    "Premium": Decimal("4290.00"),
    "Luxe": Decimal("6990.00"),
}

MIN_BOUQUET_PRICE = Decimal("1450.00")


def update_plan_prices(apps, schema_editor):
    SubscriptionPlan = apps.get_model("shop", "SubscriptionPlan")
    SubscriptionPlanTranslation = apps.get_model("shop", "SubscriptionPlanTranslation")

    for english_name, price in PLAN_PRICES.items():
        plan_ids = SubscriptionPlanTranslation.objects.filter(
            language_code="en",
            name=english_name,
        ).values_list("master_id", flat=True)
        SubscriptionPlan.objects.filter(pk__in=plan_ids).update(price=price)


def update_low_bouquet_prices(apps, schema_editor):
    Product = apps.get_model("shop", "Product")

    low_priced_products = Product.objects.filter(
        is_active=True,
        price__lt=MIN_BOUQUET_PRICE,
    ).order_by("pk")

    for index, product in enumerate(low_priced_products):
        product.price = MIN_BOUQUET_PRICE + Decimal(index * 250)
        product.save(update_fields=["price"])


def apply_price_updates(apps, schema_editor):
    update_plan_prices(apps, schema_editor)
    update_low_bouquet_prices(apps, schema_editor)


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0019_add_canceled_to_subscriptionpayment_status"),
    ]

    operations = [
        migrations.RunPython(apply_price_updates, migrations.RunPython.noop),
    ]
