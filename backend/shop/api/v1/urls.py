from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from shop.views.orders import (
    CheckoutCreateView,
    LiqPayCallbackView,
    LiqPayPaymentStatusView,
)
from shop.views.products import ProductDetailView, ProductListView
from shop.views.site_languages import SiteLanguagesView

urlpatterns = [
    path("products", ProductListView.as_view(), name="products"),
    path("favorites-products", ProductListView.as_view(), name="favorites_products"),
    path("products/<int:pk>", ProductDetailView.as_view(), name="product"),
    path("orders/checkout", CheckoutCreateView.as_view(), name="orders_checkout"),
    path(
        "orders/<int:pk>/payment-status",
        LiqPayPaymentStatusView.as_view(),
        name="order_payment_status",
    ),
    path(
        "payments/liqpay/callback",
        LiqPayCallbackView.as_view(),
        name="liqpay_callback",
    ),
    path("site/languages", SiteLanguagesView.as_view(), name="site_languages"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
