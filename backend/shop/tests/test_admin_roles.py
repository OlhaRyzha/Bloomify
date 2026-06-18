from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import Group, Permission
from django.test import RequestFactory, TestCase

from shop.admin.products import ProductAdmin
from shop.admin.roles import RoleAdminForm
from shop.admin.users import UserAdminForm
from shop.models.product import Product
from shop.tests.factories import create_product


class ProductAdminTest(TestCase):
    def test_queryset_does_not_duplicate_translated_products(self):
        product = create_product()
        product.set_current_language("uk")
        product.name = "Біла гармонія"
        product.description = "Весільний букет"
        product.tag = "Класика"
        product.save()
        product.set_current_language("en")
        product.name = "White harmony"
        product.description = "Wedding bouquet"
        product.tag = "Classic"
        product.save()

        request = RequestFactory().get("/admin/shop/product/")
        product_admin = ProductAdmin(Product, AdminSite())

        product_ids = list(
            product_admin.get_queryset(request).values_list("pk", flat=True)
        )

        self.assertEqual(product_ids, [product.pk])


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


class UserAdminFormTest(TestCase):
    def test_groups_render_as_role_multiselect(self):
        Group.objects.create(name="Seasonal coordinator")
        Group.objects.create(name="Support lead")

        form = UserAdminForm()

        html = form["groups"].as_widget()

        self.assertIn("bloomify-role-multiselect", html)
        self.assertIn('type="checkbox"', html)
        self.assertIn("Seasonal coordinator", html)
        self.assertIn("Support lead", html)

    def test_user_permissions_render_as_grouped_matrix(self):
        form = UserAdminForm()

        html = form["user_permissions"].as_widget()

        self.assertIn("bloomify-permission-matrix", html)
        self.assertIn("data-bloomify-permission-master", html)
        self.assertIn("Read", html)
        self.assertIn("Create", html)
        self.assertIn("Edit", html)
        self.assertIn("Delete", html)
