from django.http import HttpRequest
from django.shortcuts import render
from rest_framework import generics, permissions

from shop.selectors.products import get_active_products_queryset
from shop.serializers.product import ProductSerializer


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = get_active_products_queryset()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = get_active_products_queryset()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


def html(request: HttpRequest, num1: int, num2: int):
    context = {
        "num1": num1,
        "num2": num2,
        "result": num1 + num2,
    }
    return render(request, "shop/index.html", context)
