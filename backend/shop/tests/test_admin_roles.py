from django.contrib.auth.models import Group, Permission
from django.test import TestCase

from shop.admin.roles import RoleAdminForm


class RoleAdminFormTest(TestCase):
    def test_permissions_render_as_grouped_matrix(self):
        form = RoleAdminForm()

        html = form["permissions"].as_widget()

        self.assertIn("bloomify-permission-matrix", html)
        self.assertIn("data-bloomify-permission-master", html)
        self.assertIn("Read", html)
        self.assertIn("Edit", html)
        self.assertIn("Delete", html)

    def test_grouped_permissions_save_to_group(self):
        permissions = list(
            Permission.objects.filter(
                content_type__app_label="shop",
                content_type__model="product",
                codename__in=["view_product", "change_product"],
            ).values_list("id", flat=True)
        )

        form = RoleAdminForm(
            data={
                "name": "Catalog manager",
                "permissions": [str(permission_id) for permission_id in permissions],
            }
        )

        self.assertTrue(form.is_valid(), form.errors)
        group = form.save()

        self.assertIsInstance(group, Group)
        self.assertEqual(
            set(group.permissions.values_list("id", flat=True)),
            set(permissions),
        )
