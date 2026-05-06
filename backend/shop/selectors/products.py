from shop.models import Product


def get_active_products_queryset():
    return Product.objects.all()
