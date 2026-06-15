from decimal import Decimal

from django.db import migrations

DEFAULT_PLANS = [
    {
        "name": "Base",
        "description": "Perfect for beginners",
        "price": Decimal("999.00"),
        "interval": "monthly",
        "is_active": True,
    },
    {
        "name": "Premium",
        "description": "Most loved choice",
        "price": Decimal("1799.00"),
        "interval": "monthly",
        "is_active": True,
    },
    {
        "name": "Luxe",
        "description": "For true connoisseurs",
        "price": Decimal("2999.00"),
        "interval": "monthly",
        "is_active": True,
    },
]


def seed_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model("shop", "SubscriptionPlan")
    for plan_data in DEFAULT_PLANS:
        SubscriptionPlan.objects.get_or_create(
            name=plan_data["name"],
            defaults={
                "description": plan_data["description"],
                "price": plan_data["price"],
                "interval": plan_data["interval"],
                "is_active": plan_data["is_active"],
            },
        )


def unseed_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model("shop", "SubscriptionPlan")
    SubscriptionPlan.objects.filter(
        name__in=[p["name"] for p in DEFAULT_PLANS]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0010_subscription_payment"),
    ]

    operations = [
        migrations.RunPython(seed_plans, reverse_code=unseed_plans),
    ]
