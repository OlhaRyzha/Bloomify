from collections.abc import Sequence
from dataclasses import dataclass
from math import ceil
from typing import Generic, TypedDict, TypeVar

from django.db.models import Model, QuerySet
from rest_framework.request import Request

DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 50

T = TypeVar("T", bound=Model)


class PaginatedResponse(TypedDict):
    items: Sequence[object]
    page: int
    pageSize: int
    total: int
    totalPages: int
    hasNextPage: bool
    nextPage: int | None


@dataclass(frozen=True)
class PaginatedResult(Generic[T]):
    items: Sequence[T]
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next_page: bool
    next_page: int | None


def get_positive_int(value: str | None, default: int) -> int:
    if value is None:
        return default

    try:
        parsed = int(value)
    except ValueError:
        return default

    return parsed if parsed > 0 else default


def get_pagination_params(
    request: Request,
    *,
    default_page_size: int = DEFAULT_PAGE_SIZE,
    max_page_size: int = MAX_PAGE_SIZE,
) -> tuple[int, int]:
    page = get_positive_int(request.query_params.get("page"), 1)
    page_size = get_positive_int(
        request.query_params.get("pageSize"),
        default_page_size,
    )

    return page, min(page_size, max_page_size)


def paginate_items(
    *,
    request: Request,
    items: QuerySet[T] | Sequence[T],
    default_page_size: int = DEFAULT_PAGE_SIZE,
    max_page_size: int = MAX_PAGE_SIZE,
) -> PaginatedResult[T]:
    page, page_size = get_pagination_params(
        request,
        default_page_size=default_page_size,
        max_page_size=max_page_size,
    )

    total = items.count() if isinstance(items, QuerySet) else len(items)
    total_pages = max(1, ceil(total / page_size))
    safe_page = min(page, total_pages)

    offset = (safe_page - 1) * page_size
    paginated_items = list(items[offset : offset + page_size])

    return PaginatedResult(
        items=paginated_items,
        page=safe_page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
        has_next_page=safe_page < total_pages,
        next_page=safe_page + 1 if safe_page < total_pages else None,
    )


def build_paginated_response(
    *,
    paginated: PaginatedResult[T],
    serialized_items: Sequence[object],
) -> PaginatedResponse:
    return {
        "items": serialized_items,
        "page": paginated.page,
        "pageSize": paginated.page_size,
        "total": paginated.total,
        "totalPages": paginated.total_pages,
        "hasNextPage": paginated.has_next_page,
        "nextPage": paginated.next_page,
    }
