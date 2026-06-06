from shop.models.product import Product


def get_active_products_queryset():
    return Product.objects.filter(is_active=True)
