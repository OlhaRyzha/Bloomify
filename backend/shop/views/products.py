from common.pagination import build_paginated_response, paginate_items
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, permissions
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from shop.selectors.products import (
    filter_products_queryset,
    get_active_product_tags,
    get_active_products_queryset,
)
from shop.serializers.product import (
    ProductFiltersResponseSerializer,
    ProductListResponseSerializer,
    ProductSerializer,
)

PRODUCT_LIST_PARAMS = {"page", "pageSize", "search", "sort", "tag"}
PRODUCT_SORT_OPTIONS = {"default", "price-asc", "price-desc", "name-asc"}


def has_product_list_params(request: Request) -> bool:
    return any(param in request.query_params for param in PRODUCT_LIST_PARAMS)


def get_product_sort_param(request: Request) -> str:
    sort = request.query_params.get("sort")
    return sort if sort in PRODUCT_SORT_OPTIONS else "default"


class ProductListView(generics.ListAPIView):
    queryset = get_active_products_queryset()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter("lang", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("page", OpenApiTypes.INT, OpenApiParameter.QUERY),
            OpenApiParameter("pageSize", OpenApiTypes.INT, OpenApiParameter.QUERY),
            OpenApiParameter("search", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("tag", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("sort", OpenApiTypes.STR, OpenApiParameter.QUERY),
        ],
        responses={200: ProductListResponseSerializer},
    )
    def get(self, request: Request) -> Response:
        if not has_product_list_params(request):
            return super().get(request)

        queryset = filter_products_queryset(
            self.get_queryset(),
            language_code=request.query_params.get("lang"),
            search=request.query_params.get("search"),
            tag=request.query_params.get("tag"),
            sort=get_product_sort_param(request),
        )
        paginated = paginate_items(
            request=request,
            items=queryset,
            default_page_size=6,
        )
        serializer = self.get_serializer(paginated.items, many=True)

        return Response(
            build_paginated_response(
                paginated=paginated,
                serialized_items=serializer.data,
            )
        )


class ProductDetailView(generics.RetrieveAPIView):
    queryset = get_active_products_queryset()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


class ProductFiltersView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter("lang", OpenApiTypes.STR, OpenApiParameter.QUERY),
        ],
        responses={200: ProductFiltersResponseSerializer},
    )
    def get(self, request: Request) -> Response:
        tags = get_active_product_tags(
            language_code=request.query_params.get("lang"),
        )
        return Response({"tags": tags})
