from decimal import Decimal

from django.contrib.auth.models import User

from shop.models.order import Order
from shop.models.product import Product
from shop.models.subscription import Subscription, SubscriptionPayment, SubscriptionPlan
from shop.security.order_access import (
    create_order_access_token,
    hash_order_access_token,
)
from shop.types import ModelFactoryAttrs, PaymentProviderPayload, StringKeyedObjectDict

TEST_USER_EMAIL = "olha@example.com"
TEST_USER_NAME = "Olena Kolomiec"
TEST_USER_PASSWORD = "BloomifyAuth123!"

TEST_CUSTOMER_NAME = "Tom Smith"
TEST_CUSTOMER_EMAIL = "tom@example.com"
TEST_CUSTOMER_PHONE = "+380671234567"
TEST_DELIVERY_CITY = "Kyiv"
TEST_DELIVERY_ADDRESS = "Khreshchatyk 1"
TEST_DELIVERY_NOTE = "Call before delivery"

TEST_AUTH0_SUBJECT = "google-oauth2|123"
TEST_AUTH0_ACCESS_TOKEN = "auth0-access-token"
TEST_AUTH0_ID_TOKEN = "auth0-id-token"

TEST_LIQPAY_ORDER_ID = "bloomify-1"
TEST_LIQPAY_PAYMENT_ID = 123456
TEST_UNKNOWN_PRODUCT_ID = 99999
TEST_INVALID_PAYMENT_STATUS_TOKEN = "wrong-token"
TEST_INVALID_BASE64_PAYLOAD = "not-valid-base64"


def create_product(**overrides: object) -> Product:
    defaults: ModelFactoryAttrs = {
        "price": Decimal("100.00"),
    }
    defaults.update(overrides)
    product = Product.objects.create(**defaults)
    assert isinstance(product, Product)
    return product


def create_order(**overrides: object) -> Order:
    defaults: ModelFactoryAttrs = {
        "payment_provider": "",
        "payment_method": "cash_on_delivery",
        "payment_status": "not_required",
        "status": "pending",
        "total": Decimal("100.00"),
    }
    defaults.update(overrides)
    if defaults.get("liqpay_order_id") and not defaults.get("provider_order_id"):
        defaults["provider_order_id"] = defaults["liqpay_order_id"]
    if defaults.get("liqpay_payment_id") and not defaults.get("provider_payment_id"):
        defaults["provider_payment_id"] = defaults["liqpay_payment_id"]
    order = Order.objects.create(**defaults)
    assert isinstance(order, Order)
    return order


def create_liqpay_order(**overrides: object) -> Order:
    defaults: ModelFactoryAttrs = {
        "payment_provider": "liqpay",
        "payment_method": "card",
        "payment_status": "pending",
        "status": "pending",
        "liqpay_order_id": TEST_LIQPAY_ORDER_ID,
        "provider_order_id": TEST_LIQPAY_ORDER_ID,
        "total": Decimal("1750.00"),
    }
    defaults.update(overrides)
    return create_order(**defaults)


def create_test_user(
    *,
    email: str = TEST_USER_EMAIL,
    password: str = TEST_USER_PASSWORD,
    name: str = TEST_USER_NAME,
) -> User:
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=name,
    )
    assert isinstance(user, User)
    return user


def build_register_payload(
    *,
    name: str = TEST_USER_NAME,
    email: str = TEST_USER_EMAIL,
    password: str = TEST_USER_PASSWORD,
) -> StringKeyedObjectDict:
    return {
        "name": name,
        "email": email,
        "password": password,
    }


def build_login_payload(
    *,
    email: str = TEST_USER_EMAIL,
    password: str = TEST_USER_PASSWORD,
) -> StringKeyedObjectDict:
    return {
        "email": email,
        "password": password,
    }


def build_auth0_login_payload(
    *,
    access_token: str = TEST_AUTH0_ACCESS_TOKEN,
    id_token: str = TEST_AUTH0_ID_TOKEN,
) -> StringKeyedObjectDict:
    return {
        "accessToken": access_token,
        "idToken": id_token,
    }


def build_checkout_payload(
    *,
    product_id: int,
    payment_method: str,
    quantity: int = 1,
    locale: str | None = None,
    delivery_note: str = "",
) -> StringKeyedObjectDict:
    payload: StringKeyedObjectDict = {
        "customerName": TEST_CUSTOMER_NAME,
        "email": TEST_CUSTOMER_EMAIL,
        "phone": TEST_CUSTOMER_PHONE,
        "city": TEST_DELIVERY_CITY,
        "address": TEST_DELIVERY_ADDRESS,
        "paymentMethod": payment_method,
        "items": [{"id": product_id, "quantity": quantity}],
    }
    if locale is not None:
        payload["locale"] = locale
    if delivery_note:
        payload["deliveryNote"] = delivery_note
    return payload


def build_liqpay_provider_payload(
    order: Order,
    *,
    status: str = "success",
    payment_id: int = TEST_LIQPAY_PAYMENT_ID,
) -> PaymentProviderPayload:
    return {
        "order_id": order.provider_order_id or order.liqpay_order_id or "",
        "status": status,
        "payment_id": payment_id,
        "amount": str(order.total),
        "currency": "UAH",
    }


def build_liqpay_callback_request(
    *,
    data: str,
    signature: str,
) -> StringKeyedObjectDict:
    return {
        "data": data,
        "signature": signature,
    }


def build_payment_status_request(token: str) -> StringKeyedObjectDict:
    return {"token": token}


def create_subscription_plan(
    *,
    name: str = "Test Plan",
    description: str = "",
    **overrides: object,
) -> SubscriptionPlan:
    defaults: ModelFactoryAttrs = {
        "price": Decimal("299.00"),
        "interval": "monthly",
        "is_active": True,
    }
    defaults.update(overrides)
    plan = SubscriptionPlan.objects.create(**defaults)
    for lang in ("uk", "en"):
        plan.set_current_language(lang)
        plan.name = name
        plan.description = description
        plan.save()
    assert isinstance(plan, SubscriptionPlan)
    return plan


def create_subscription(
    user: User,
    plan: SubscriptionPlan,
    **overrides: object,
) -> Subscription:
    from datetime import date

    defaults: ModelFactoryAttrs = {
        "user": user,
        "plan": plan,
        "status": "active",
        "start_date": date.today(),
    }
    defaults.update(overrides)
    subscription = Subscription.objects.create(**defaults)
    assert isinstance(subscription, Subscription)
    return subscription


def create_subscription_payment(
    subscription: Subscription,
    *,
    with_token: bool = False,
    **overrides: object,
) -> tuple[SubscriptionPayment, str | None]:
    defaults: ModelFactoryAttrs = {
        "subscription": subscription,
        "amount": subscription.plan.price,
        "status": "pending",
    }
    defaults.update(overrides)
    payment = SubscriptionPayment.objects.create(**defaults)
    assert isinstance(payment, SubscriptionPayment)
    token: str | None = None
    if with_token:
        token = create_order_access_token()
        payment.payment_status_token_hash = hash_order_access_token(token)
        payment.save(update_fields=["payment_status_token_hash"])
    return payment, token


def build_subscription_callback_payload(
    payment: SubscriptionPayment,
    *,
    status: str = "success",
    payment_id: int = 111222,
) -> PaymentProviderPayload:
    return {
        "order_id": payment.provider_order_id or "",
        "status": status,
        "payment_id": payment_id,
        "amount": str(payment.amount),
        "currency": "UAH",
    }
