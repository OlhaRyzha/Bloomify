from django.db import migrations


ROLE_DEFINITIONS = {
    "Owner": {
        "all": True,
    },
    "Manager": {
        "shop_actions": ["view", "change", "delete"],
        "include_auth_read": True,
    },
    "Editor": {
        "shop_actions": ["view", "change"],
    },
    "Viewer": {
        "shop_actions": ["view"],
    },
}


SHOP_MODELS = [
    "product",
    "subscriptionplan",
    "subscription",
    "order",
    "sitelanguagesettings",
]
AUTH_MODELS_READ = ["user", "group"]


def seed_roles(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")

    all_permissions = Permission.objects.all()

    for role_name, config in ROLE_DEFINITIONS.items():
        group, _ = Group.objects.get_or_create(name=role_name)

        if config.get("all"):
            group.permissions.set(all_permissions)
            group.save()
            continue

        codenames = set()

        for action in config.get("shop_actions", []):
            for model_name in SHOP_MODELS:
                codenames.add(f"{action}_{model_name}")

        if config.get("include_auth_read"):
            for model_name in AUTH_MODELS_READ:
                codenames.add(f"view_{model_name}")

        perms = Permission.objects.filter(codename__in=codenames)
        group.permissions.set(perms)
        group.save()


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0003_sitelanguagesettings_alter_producttranslation_master"),
    ]

    operations = [
        migrations.RunPython(seed_roles, noop_reverse),
    ]
