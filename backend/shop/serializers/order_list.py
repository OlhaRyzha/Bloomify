from rest_framework.request import Request

from shop.models.order import Order


def serialize_order(
    order: Order,
    *,
    request: Request,
) -> dict:
    return {
        "id": order.pk,
        "status": order.status,
        "paymentStatus": order.payment_status,
        "paymentProvider": order.payment_provider,
        "paymentMethod": order.payment_method,
        "createdAt": order.created_at,
        "total": order.total,
        "items": [
            {
                "id": item.pk,
                "productId": item.product.pk,
                "name": str(item.product),
                "imageUrl": (
                    request.build_absolute_uri(item.product.image.url)
                    if item.product.image
                    else ""
                ),
                "quantity": item.quantity,
                "unitPrice": item.unit_price,
                "total": item.total,
            }
            for item in order.items.all()
        ],
    }
