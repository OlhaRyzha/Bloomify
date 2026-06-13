from decimal import Decimal

from django.test import TestCase

from shop import models
from shop.models.order import OrderItem
from shop.tests.factories import create_order, create_product


class ModelsSmokeTest(TestCase):
    def test_models_module_imports(self):
        self.assertIsNotNone(models)


class OrderModelTest(TestCase):
    def test_total_price_falls_back_to_order_items_when_total_is_empty(self):
        product = create_product(price="125.00")
        order = create_order(total=Decimal("0.00"))
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=2,
            unit_price="125.00",
            total="250.00",
        )

        self.assertEqual(order.total_price, Decimal("250.00"))
