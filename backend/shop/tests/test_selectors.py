from django.test import TestCase

from shop.models.product import Product
from shop.selectors.products import (
    get_active_product_tags,
    get_active_products_queryset,
)


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

    def test_get_active_product_tags_returns_unique_active_tags_for_language(self):
        active_product = Product.objects.create(price=10, is_active=True)
        active_product.set_current_language("uk")
        active_product.name = "Троянди"
        active_product.tag = "Класика"
        active_product.save()
        duplicate_product = Product.objects.create(price=20, is_active=True)
        duplicate_product.set_current_language("uk")
        duplicate_product.name = "Білі троянди"
        duplicate_product.tag = "Класика"
        duplicate_product.save()
        inactive_product = Product.objects.create(price=30, is_active=False)
        inactive_product.set_current_language("uk")
        inactive_product.name = "Півонії"
        inactive_product.tag = "Сезонні"
        inactive_product.save()

        tags = get_active_product_tags(language_code="uk")

        self.assertEqual(tags, ["Класика"])
