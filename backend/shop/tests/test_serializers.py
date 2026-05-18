from django.test import TestCase


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
