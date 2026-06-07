import jwt
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from pydantic import BaseModel, ValidationError, field_validator


class Auth0ConfigurationError(RuntimeError):
    pass


class Auth0TokenError(RuntimeError):
    pass


class Auth0UserPayload(BaseModel):
    sub: str
    email: str
    name: str = ""
    email_verified: bool = False

    @field_validator("email")
    @classmethod
    def validate_email_address(cls, value: str) -> str:
        try:
            validate_email(value)
        except DjangoValidationError as exc:
            raise ValueError("Invalid email address") from exc
        return value


class Auth0AccessPayload(BaseModel):
    sub: str


def _decode_auth0_token(token: str, *, audience: str) -> object:
    issuer = settings.AUTH0_ISSUER or f"https://{settings.AUTH0_DOMAIN}/"
    jwks_url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
    jwks_client = jwt.PyJWKClient(jwks_url)
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=audience,
        issuer=issuer,
    )


def verify_auth0_tokens(access_token: str, id_token: str) -> Auth0UserPayload:
    if (
        not settings.AUTH0_DOMAIN
        or not settings.AUTH0_AUDIENCE
        or not settings.AUTH0_CLIENT_ID
    ):
        raise Auth0ConfigurationError("Auth0 is not configured")

    try:
        access_payload = Auth0AccessPayload.model_validate(
            _decode_auth0_token(access_token, audience=settings.AUTH0_AUDIENCE)
        )
        id_payload = Auth0UserPayload.model_validate(
            _decode_auth0_token(id_token, audience=settings.AUTH0_CLIENT_ID)
        )
    except (jwt.PyJWTError, ValidationError) as exc:
        raise Auth0TokenError("Invalid Auth0 token") from exc

    if access_payload.sub != id_payload.sub:
        raise Auth0TokenError("Auth0 token subjects do not match")

    if not id_payload.email_verified:
        raise Auth0TokenError("Auth0 email is not verified")

    return id_payload
