from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, SiteLanguageSettings
from .serializers import ProductSerializer, SiteLanguageSettingsSerializer


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


class SiteLanguagesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings_obj, _ = SiteLanguageSettings.objects.get_or_create(pk=1)
        serializer = SiteLanguageSettingsSerializer(settings_obj)
        return Response(serializer.data)
