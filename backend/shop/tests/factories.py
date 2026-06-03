from decimal import Decimal

from shop.models.order import Order
from shop.models.product import Product
from shop.types import ModelFactoryAttrs


def create_product(**overrides: object) -> Product:
    defaults: ModelFactoryAttrs = {
        "price": Decimal("100.00"),
    }
    defaults.update(overrides)
    product = Product.objects.create(**defaults)
    assert isinstance(product, Product)
    return product


def create_order(**overrides: object) -> Order:
    defaults: ModelFactoryAttrs = {
        "payment_provider": "",
        "payment_method": "cash_on_delivery",
        "payment_status": "not_required",
        "status": "pending",
        "total": Decimal("100.00"),
    }
    defaults.update(overrides)
    order = Order.objects.create(**defaults)
    assert isinstance(order, Order)
    return order
