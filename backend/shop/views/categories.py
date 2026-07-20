from common.cache import cache_public_catalog_response
from django.utils.decorators import method_decorator
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, permissions
from rest_framework.throttling import ScopedRateThrottle

from shop.models.category import Category
from shop.serializers.category import (
    CategoryDetailSerializer,
    CategoryListItemSerializer,
)

LANG_PARAM = OpenApiParameter("lang", OpenApiTypes.STR, OpenApiParameter.QUERY)


@extend_schema(parameters=[LANG_PARAM])
@method_decorator(cache_public_catalog_response, name="dispatch")
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategoryListItemSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "product_list"
    pagination_class = None


@extend_schema(parameters=[LANG_PARAM])
@method_decorator(cache_public_catalog_response, name="dispatch")
class CategoryDetailView(generics.RetrieveAPIView):
    queryset = Category.objects.filter(is_active=True).prefetch_related(
        "blocks", "products"
    )
    serializer_class = CategoryDetailSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "product_list"
    lookup_field = "slug"
