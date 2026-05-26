from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from shop.tests.factories import create_product


class ProductApiPermissionsTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_anonymous_users_can_read_products(self):
        create_product(price="1200.00")

        response = self.client.get("/products")

        self.assertEqual(response.status_code, 200)

    def test_anonymous_users_cannot_create_products(self):
        response = self.client.post(
            "/products",
            data={"price": "1200.00"},
            content_type="application/json",
        )

        self.assertIn(response.status_code, {401, 403})

    def test_non_staff_users_cannot_delete_products(self):
        product = create_product(price="1200.00")
        user = get_user_model().objects.create_user(
            username="customer",
            password="customer-pass",
        )
        self.client.force_authenticate(user=user)

        response = self.client.delete(f"/products/{product.pk}")

        self.assertEqual(response.status_code, 403)
        self.assertTrue(type(product).objects.filter(pk=product.pk).exists())

    def test_staff_users_can_delete_products(self):
        product = create_product(price="1200.00")
        user = get_user_model().objects.create_user(
            username="staff",
            password="staff-pass",
            is_staff=True,
        )
        self.client.force_authenticate(user=user)

        response = self.client.delete(f"/products/{product.pk}")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(type(product).objects.filter(pk=product.pk).exists())
