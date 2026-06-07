from typing import cast

from django.db.models import QuerySet
from django.db.models.functions import Lower

from shop.models.product import Product


def get_active_products_queryset() -> QuerySet[Product]:
    return cast(QuerySet[Product], Product.objects.filter(is_active=True))


def filter_products_queryset(
    queryset: QuerySet[Product],
    *,
    search: str | None = None,
    tag: str | None = None,
    sort: str | None = None,
) -> QuerySet[Product]:
    if search:
        queryset = queryset.filter(
            translations__name__icontains=search
        ) | queryset.filter(translations__description__icontains=search)

    if tag and tag != "all":
        queryset = queryset.filter(translations__tag=tag)

    queryset = queryset.distinct()

    match sort:
        case "price-asc":
            return queryset.order_by("price", "pk")
        case "price-desc":
            return queryset.order_by("-price", "pk")
        case "name-asc":
            return queryset.order_by(Lower("translations__name"), "pk")
        case _:
            return queryset.order_by("translations__name", "pk")
