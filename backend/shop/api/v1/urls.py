from django.urls import path

from shop.views.auth import (
    Auth0LoginView,
    CurrentUserView,
    LoginView,
    LogoutView,
    RefreshView,
    RegisterView,
)
from shop.views.health import HealthCheckView
from shop.views.orders import (
    CheckoutCreateView,
    LiqPayCallbackView,
    LiqPayPaymentStatusView,
    OrderListView,
)
from shop.views.products import ProductDetailView, ProductFiltersView, ProductListView
from shop.views.promo_codes import ValidatePromoCodeView
from shop.views.site_languages import SiteLanguagesView
from shop.views.subscriptions import (
    LiqPaySubscriptionCallbackView,
    MySubscriptionView,
    SubscribeView,
    SubscriptionPaymentStatusView,
    SubscriptionPlanListView,
    UnsubscribeView,
    UpgradeSubscriptionView,
)

urlpatterns = [
    path("products", ProductListView.as_view(), name="products"),
    path("products/filters", ProductFiltersView.as_view(), name="product_filters"),
    path("favorites-products", ProductListView.as_view(), name="favorites_products"),
    path("products/<int:pk>", ProductDetailView.as_view(), name="product"),
    path("orders", OrderListView.as_view(), name="orders"),
    path("orders/checkout", CheckoutCreateView.as_view(), name="orders_checkout"),
    path(
        "orders/promo/validate", ValidatePromoCodeView.as_view(), name="promo_validate"
    ),
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
    path(
        "payments/liqpay/subscription-callback",
        LiqPaySubscriptionCallbackView.as_view(),
        name="liqpay_subscription_callback",
    ),
    path(
        "subscriptions/plans",
        SubscriptionPlanListView.as_view(),
        name="subscription_plans",
    ),
    path("subscriptions/me", MySubscriptionView.as_view(), name="my_subscription"),
    path("subscriptions/subscribe", SubscribeView.as_view(), name="subscribe"),
    path("subscriptions/unsubscribe", UnsubscribeView.as_view(), name="unsubscribe"),
    path(
        "subscriptions/upgrade",
        UpgradeSubscriptionView.as_view(),
        name="subscription_upgrade",
    ),
    path(
        "subscriptions/payments/<int:pk>/status",
        SubscriptionPaymentStatusView.as_view(),
        name="subscription_payment_status",
    ),
    path("health", HealthCheckView.as_view(), name="health"),
    path("site/languages", SiteLanguagesView.as_view(), name="site_languages"),
    path("auth/register/", RegisterView.as_view(), name="auth_register"),
    path("auth/token/", LoginView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", RefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth_logout"),
    path("auth/me/", CurrentUserView.as_view(), name="auth_me"),
    path("auth/oauth/auth0/", Auth0LoginView.as_view(), name="auth_auth0"),
]
