from django.test import TestCase

from shop.models.product import Product
from shop.selectors.products import get_active_products_queryset


class SelectorsTest(TestCase):
    def test_get_active_products_queryset_returns_queryset(self):
        Product.objects.create(price=10)

        queryset = get_active_products_queryset()

        self.assertEqual(queryset.count(), 1)

    def test_get_active_products_queryset_excludes_inactive_products(self):
        active_product = Product.objects.create(price=10, is_active=True)
        inactive_product = Product.objects.create(price=20, is_active=False)

        queryset = get_active_products_queryset()

        self.assertIn(active_product, queryset)
        self.assertNotIn(inactive_product, queryset)
