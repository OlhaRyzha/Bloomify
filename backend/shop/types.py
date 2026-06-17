from collections.abc import Mapping
from math import isfinite
from typing import TYPE_CHECKING, NotRequired, TypedDict, TypeGuard

if TYPE_CHECKING:
    from shop.models.order import Order

type JsonPrimitive = str | int | float | bool | None
type JsonValue = JsonPrimitive | list[JsonValue] | dict[str, JsonValue]
type JsonObject = dict[str, JsonValue]
type JsonMapping = Mapping[str, JsonValue]

type StringKeyedObjectDict = dict[str, object]
type StringKeyedObjectMapping = Mapping[str, object]

type DjangoWidgetAttrs = StringKeyedObjectDict
type ModelFactoryAttrs = StringKeyedObjectDict
type DatabaseConfig = StringKeyedObjectDict

type PaymentProviderPayload = JsonObject
type TelegramMessagePayload = dict[str, str | bool]


class CheckoutItemData(TypedDict):
    id: int
    quantity: int


class CheckoutOrderPayload(TypedDict):
    customerName: str
    email: str
    phone: str
    city: str
    address: str
    paymentMethod: str
    items: list[CheckoutItemData]
    deliveryNote: NotRequired[str]
    locale: NotRequired[str]
    promoCode: NotRequired[str]


class CheckoutOrderResult(TypedDict):
    order: "Order"
    payment_status_token: str


def is_json_object(value: object) -> TypeGuard[JsonObject]:
    return isinstance(value, dict) and all(
        isinstance(key, str) and is_json_value(item) for key, item in value.items()
    )


def is_json_value(value: object) -> TypeGuard[JsonValue]:
    if value is None or isinstance(value, str | bool):
        return True

    if isinstance(value, int):
        return True

    if isinstance(value, float):
        return isfinite(value)

    if isinstance(value, list):
        return all(is_json_value(item) for item in value)

    return is_json_object(value)
