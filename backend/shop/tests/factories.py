from decimal import Decimal

from django.contrib.auth.models import User

from shop.models.order import Order
from shop.models.product import Product
from shop.types import ModelFactoryAttrs, PaymentProviderPayload, StringKeyedObjectDict

TEST_USER_EMAIL = "olha@example.com"
TEST_USER_NAME = "Olha Ryzha"
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
TEST_LIQPAY_DOCUMENTATION_DATA = (
    "eyJwdWJsaWNfa2V5IjoiaTAwMDAwMDAwIiwidmVyc2lvbiI6NywiYWN0aW9u"
    "IjoicGF5IiwiYW1vdW50IjoiMyIsImN1cnJlbmN5IjoiVUFIIiwiZGVzY3Jp"
    "cHRpb24iOiJ0ZXN0Iiwib3JkZXJfaWQiOiIwMDAwMDEifQ=="
)
TEST_LIQPAY_DOCUMENTATION_SIGNATURE = "0adgJ8F2Ds5HCVkcz4AlmdLMRoIJf7IxsL3QmeFRz/s="


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
