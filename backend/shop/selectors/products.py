from typing import cast

from django.db.models import QuerySet
from django.db.models.functions import Lower

from shop.models.product import Product


def get_active_products_queryset() -> QuerySet[Product]:
    return cast(
        QuerySet[Product],
        Product.objects.filter(is_active=True).order_by("pk").distinct(),
    )


def filter_products_queryset(
    queryset: QuerySet[Product],
    *,
    language_code: str | None = None,
    search: str | None = None,
    tag: str | None = None,
    sort: str | None = None,
) -> QuerySet[Product]:
    if language_code:
        queryset = queryset.filter(translations__language_code=language_code)

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


def get_active_product_tags(*, language_code: str | None = None) -> list[str]:
    queryset = get_active_products_queryset().exclude(translations__tag="")
    if language_code:
        queryset = queryset.filter(translations__language_code=language_code)

    return sorted(
        {
            tag
            for tag in queryset.values_list("translations__tag", flat=True)
            if isinstance(tag, str) and tag.strip()
        }
    )
