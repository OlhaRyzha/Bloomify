from decimal import Decimal
from typing import Any

from shop.models.order import Order
from shop.models.product import Product


def create_product(**overrides: Any) -> Product:
    defaults = {
        "price": Decimal("100.00"),
    }
    defaults.update(overrides)
    return Product.objects.create(**defaults)


def create_order(**overrides: Any) -> Order:
    defaults = {
        "payment_provider": "",
        "payment_method": "cash_on_delivery",
        "payment_status": "not_required",
        "status": "pending",
        "total": Decimal("100.00"),
    }
    defaults.update(overrides)
    return Order.objects.create(**defaults)
