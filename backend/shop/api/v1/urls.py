from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from shop.views.orders import CheckoutCreateView, LiqPayCallbackView
from shop.views.products import ProductDetailView, ProductListCreateView, html
from shop.views.site_languages import SiteLanguagesView

urlpatterns = [
    path("products", ProductListCreateView.as_view(), name="products"),
    path(
        "favorites-products", ProductListCreateView.as_view(), name="favorites_products"
    ),
    path("products/<int:pk>", ProductDetailView.as_view(), name="product"),
    path("orders/checkout", CheckoutCreateView.as_view(), name="orders_checkout"),
    path(
        "payments/liqpay/callback",
        LiqPayCallbackView.as_view(),
        name="liqpay_callback",
    ),
    path("site/languages", SiteLanguagesView.as_view(), name="site_languages"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("html/<int:num1>/<int:num2>", html),
]
