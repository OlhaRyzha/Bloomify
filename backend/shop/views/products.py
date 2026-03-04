from rest_framework import generics, permissions

from shop.selectors import get_active_products_queryset
from shop.serializers import ProductSerializer


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = get_active_products_queryset()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = get_active_products_queryset()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
