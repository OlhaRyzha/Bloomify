from decimal import Decimal

from django.db import migrations

BOUQUET_PRICES = {
    "Тропічний вибух": Decimal("3900.00"),
    "Біла гармонія": Decimal("3600.00"),
    "Золотий захід": Decimal("3800.00"),
    "Сонячний настрій": Decimal("3400.00"),
    "Блакитна гармонія": Decimal("4200.00"),
    "Романтична палітра": Decimal("4600.00"),
    "Ніжний світанок": Decimal("3900.00"),
    "Біла класика": Decimal("4300.00"),
    "Контраст кохання": Decimal("4900.00"),
    "Пудрова мрія": Decimal("4400.00"),
    "Мрія кохання": Decimal("4700.00"),
    "Весняна ніжність": Decimal("3700.00"),
    "Персиковий поцілунок": Decimal("4100.00"),
    "Лавандова елегантність": Decimal("4500.00"),
    "Квітковий візок мрій": Decimal("6500.00"),
    "Вечірній шарм": Decimal("5200.00"),
    "Персикова класика": Decimal("4800.00"),
    'Квіткова коробка "Ніжність"': Decimal("5600.00"),
    "Великодня ніжність": Decimal("5300.00"),
    "Природній шарм": Decimal("5400.00"),
    "Весняна симфонія тюльпанів": Decimal("6200.00"),
    "Полум'я з квітів": Decimal("7600.00"),
}


def raise_default_bouquet_prices(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductTranslation = apps.get_model("shop", "ProductTranslation")

    for name, price in BOUQUET_PRICES.items():
        product_ids = ProductTranslation.objects.filter(
            language_code="uk",
            name=name,
        ).values_list("master_id", flat=True)
        Product.objects.filter(pk__in=product_ids).update(price=price)


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0020_update_commercial_prices"),
    ]

    operations = [
        migrations.RunPython(raise_default_bouquet_prices, migrations.RunPython.noop),
    ]
