from shop.services.liqpay import LIQPAY_PROVIDER
from shop.services.payment_provider_types import (
    PaymentProvider,
    PaymentProviderConfigurationError,
)

PAYMENT_PROVIDER_BY_PAYMENT_METHOD = {
    "apple_pay": "liqpay",
    "google_pay": "liqpay",
    "card": "liqpay",
}
PAYMENT_METHODS_WITH_PROVIDER = set(PAYMENT_PROVIDER_BY_PAYMENT_METHOD)


def get_payment_provider(provider_key: str) -> PaymentProvider:
    if provider_key == "liqpay":
        return LIQPAY_PROVIDER

    raise PaymentProviderConfigurationError(
        f"Unsupported payment provider: {provider_key}"
    )


def get_payment_provider_key_for_method(payment_method: str) -> str:
    return PAYMENT_PROVIDER_BY_PAYMENT_METHOD.get(payment_method, "")
