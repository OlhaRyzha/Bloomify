from django.urls import path

from shop.views.auth import (
    Auth0LoginView,
    CurrentUserView,
    LoginView,
    LogoutView,
    RefreshView,
    RegisterView,
)
from shop.views.orders import (
    CheckoutCreateView,
    LiqPayCallbackView,
    LiqPayPaymentStatusView,
    OrderListView,
)
from shop.views.products import ProductDetailView, ProductFiltersView, ProductListView
from shop.views.site_languages import SiteLanguagesView

urlpatterns = [
    path("products", ProductListView.as_view(), name="products"),
    path("products/filters", ProductFiltersView.as_view(), name="product_filters"),
    path("favorites-products", ProductListView.as_view(), name="favorites_products"),
    path("products/<int:pk>", ProductDetailView.as_view(), name="product"),
    path("orders", OrderListView.as_view(), name="orders"),
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
    path("auth/register/", RegisterView.as_view(), name="auth_register"),
    path("auth/token/", LoginView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", RefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth_logout"),
    path("auth/me/", CurrentUserView.as_view(), name="auth_me"),
    path("auth/oauth/auth0/", Auth0LoginView.as_view(), name="auth_auth0"),
]
