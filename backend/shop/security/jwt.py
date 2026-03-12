from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from django.conf import settings

from shop.serializers.jwt import AccessTokenPayload


def create_access_token(*, user_id: UUID, email: str, expires_minutes: int) -> str:
    now = datetime.now(UTC)
    exp_dt = now + timedelta(minutes=expires_minutes)

    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": int(exp_dt.timestamp()),
    }
    return jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def decode_access_token(token: str) -> AccessTokenPayload:
    decoded = jwt.decode(
        token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )
    return AccessTokenPayload.model_validate(decoded)
