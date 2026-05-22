from django.test import TestCase

from shop.models.product import Product
from shop.selectors.products import get_active_products_queryset


class SelectorsTest(TestCase):
    def test_get_active_products_queryset_returns_queryset(self):
        Product.objects.create(price=10)

        queryset = get_active_products_queryset()

        self.assertEqual(queryset.count(), 1)
