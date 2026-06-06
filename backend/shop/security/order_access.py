import secrets

from django.utils.crypto import salted_hmac

ORDER_ACCESS_TOKEN_BYTES = 24


def create_order_access_token() -> str:
    return secrets.token_urlsafe(ORDER_ACCESS_TOKEN_BYTES)


def hash_order_access_token(token: str) -> str:
    return salted_hmac(
        "shop.order_access_token",
        token,
    ).hexdigest()
