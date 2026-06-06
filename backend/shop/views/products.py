from rest_framework import generics, permissions

from shop.selectors.products import get_active_products_queryset
from shop.serializers.product import ProductSerializer


class ProductListView(generics.ListAPIView):
    queryset = get_active_products_queryset()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


class ProductDetailView(generics.RetrieveAPIView):
    queryset = get_active_products_queryset()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
