from django.test import TestCase

from shop.serializers.product import ProductSerializer
from shop.tests.factories import create_product


class SerializersSmokeTest(TestCase):
    def test_serializer_classes_import(self):
        from shop.serializers.order import CheckoutCreateSerializer
        from shop.serializers.product import ProductSerializer
        from shop.serializers.site_language_settings import (
            SiteLanguageSettingsSerializer,
        )

        self.assertIsNotNone(CheckoutCreateSerializer)
        self.assertIsNotNone(ProductSerializer)
        self.assertIsNotNone(SiteLanguageSettingsSerializer)


class ProductSerializerTest(TestCase):
    def test_price_is_serialized_as_decimal_string(self):
        product = create_product(price="125.50")

        serializer = ProductSerializer(product)

        self.assertEqual(serializer.data["price"], "125.50")
