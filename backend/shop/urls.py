from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from shop.views import ProductDetailView, ProductListCreateView

urlpatterns = [
    path("products", ProductListCreateView.as_view(), name="products"),
    path(
        "favorites-products", ProductListCreateView.as_view(), name="favorites_products"
    ),
    path("products/<int:pk>", ProductDetailView.as_view(), name="product"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
