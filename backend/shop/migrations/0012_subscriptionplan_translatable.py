import django.db.models.deletion
import parler.fields
from django.db import migrations, models

PLAN_TRANSLATIONS = {
    "Base": {
        "uk": {"name": "Базовий", "description": "Ідеально для початківців"},
        "pl": {"name": "Podstawowy", "description": "Idealny dla początkujących"},
    },
    "Premium": {
        "uk": {"name": "Преміум", "description": "Найпопулярніший вибір"},
        "pl": {"name": "Premium", "description": "Najpopularniejszy wybór"},
    },
    "Luxe": {
        "uk": {"name": "Люкс", "description": "Для справжніх цінителів"},
        "pl": {"name": "Luksusowy", "description": "Dla prawdziwych koneserów"},
    },
}


def migrate_to_translations(apps, schema_editor):
    SubscriptionPlan = apps.get_model("shop", "SubscriptionPlan")
    SubscriptionPlanTranslation = apps.get_model("shop", "SubscriptionPlanTranslation")

    rows = []
    for plan in SubscriptionPlan.objects.all():
        en_name = getattr(plan, "name", "") or ""
        en_desc = getattr(plan, "description", "") or ""

        rows.append(
            SubscriptionPlanTranslation(
                master_id=plan.pk,
                language_code="en",
                name=en_name,
                description=en_desc,
            )
        )

        extra = PLAN_TRANSLATIONS.get(en_name, {})
        for lang_code, trans in extra.items():
            rows.append(
                SubscriptionPlanTranslation(
                    master_id=plan.pk,
                    language_code=lang_code,
                    name=trans["name"],
                    description=trans["description"],
                )
            )

    if rows:
        SubscriptionPlanTranslation.objects.bulk_create(rows, ignore_conflicts=True)


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0011_seed_default_subscription_plans"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="subscriptionplan",
            options={
                "ordering": ["translations__name"],
                "verbose_name": "Subscription plan",
                "verbose_name_plural": "Subscription plans",
            },
        ),
        migrations.CreateModel(
            name="SubscriptionPlanTranslation",
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
                    "language_code",
                    models.CharField(
                        db_index=True, max_length=15, verbose_name="Language"
                    ),
                ),
                ("name", models.CharField(max_length=200, verbose_name="Name")),
                (
                    "description",
                    models.TextField(blank=True, verbose_name="Description"),
                ),
                (
                    "master",
                    models.ForeignKey(
                        editable=False,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="translations",
                        to="shop.subscriptionplan",
                    ),
                ),
            ],
            options={
                "verbose_name": "Subscription plan Translation",
                "db_table": "shop_subscriptionplan_translation",
                "db_tablespace": "",
                "managed": True,
                "default_permissions": (),
                "unique_together": {("language_code", "master")},
            },
            bases=(models.Model,),
        ),
        migrations.RunPython(migrate_to_translations, migrations.RunPython.noop),
        migrations.RemoveField(model_name="subscriptionplan", name="name"),
        migrations.RemoveField(model_name="subscriptionplan", name="description"),
    ]
