import logging

import jwt
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from pydantic import BaseModel, ValidationError, field_validator

from shop.services.identity_provider_types import (
    ExternalIdentityPayload,
    IdentityProviderConfigurationError,
    IdentityProviderTokenError,
)
from shop.types import JsonObject, is_json_object

logger = logging.getLogger(__name__)


class Auth0ConfigurationError(IdentityProviderConfigurationError):
    pass


class Auth0TokenError(IdentityProviderTokenError):
    pass


class Auth0UserPayload(ExternalIdentityPayload):
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


def _get_required_auth0_setting(name: str) -> str:
    value = getattr(settings, name, "")

    if not isinstance(value, str) or not value.strip():
        raise Auth0ConfigurationError(f"{name} is not configured")

    return value.strip()


def _get_auth0_domain() -> str:
    domain = _get_required_auth0_setting("AUTH0_DOMAIN")

    return domain.removeprefix("https://").removeprefix("http://").rstrip("/")


def _get_auth0_issuer() -> str:
    issuer = getattr(settings, "AUTH0_ISSUER", "")

    if isinstance(issuer, str) and issuer.strip():
        normalized_issuer = issuer.strip()
    else:
        normalized_issuer = f"https://{_get_auth0_domain()}/"

    return (
        normalized_issuer
        if normalized_issuer.endswith("/")
        else f"{normalized_issuer}/"
    )


def _get_auth0_jwks_url() -> str:
    return f"https://{_get_auth0_domain()}/.well-known/jwks.json"


def _get_auth0_algorithms() -> list[str]:
    algorithms = settings.AUTH0_ALGORITHMS

    if not algorithms:
        raise Auth0ConfigurationError("AUTH0_ALGORITHMS is not configured")

    return algorithms


def _decode_auth0_token(token: str, *, audience: str) -> JsonObject:
    jwks_client = jwt.PyJWKClient(_get_auth0_jwks_url())
    signing_key = jwks_client.get_signing_key_from_jwt(token)

    decoded_token: object = jwt.decode(
        token,
        signing_key.key,
        algorithms=_get_auth0_algorithms(),
        audience=audience,
        issuer=_get_auth0_issuer(),
    )

    if not is_json_object(decoded_token):
        raise Auth0TokenError("Decoded Auth0 token payload is invalid")

    return decoded_token


def verify_auth0_tokens(access_token: str, id_token: str) -> Auth0UserPayload:
    try:
        audience = _get_required_auth0_setting("AUTH0_AUDIENCE")
        client_id = _get_required_auth0_setting("AUTH0_CLIENT_ID")
        domain = _get_auth0_domain()
        issuer = _get_auth0_issuer()
    except Auth0ConfigurationError:
        logger.exception("Auth0 configuration is missing or invalid")
        raise

    try:
        access_payload = Auth0AccessPayload.model_validate(
            _decode_auth0_token(access_token, audience=audience)
        )
    except (jwt.PyJWTError, ValidationError, Auth0TokenError) as exc:
        logger.exception(
            "Auth0 access token validation failed. domain=%s issuer=%s audience=%s",
            domain,
            issuer,
            audience,
        )
        raise Auth0TokenError("Invalid Auth0 access token") from exc

    try:
        id_payload = Auth0UserPayload.model_validate(
            _decode_auth0_token(id_token, audience=client_id)
        )
    except (jwt.PyJWTError, ValidationError, Auth0TokenError) as exc:
        logger.exception(
            "Auth0 ID token validation failed. domain=%s issuer=%s client_id=%s",
            domain,
            issuer,
            client_id,
        )
        raise Auth0TokenError("Invalid Auth0 ID token") from exc

    if access_payload.sub != id_payload.sub:
        logger.error(
            "Auth0 token subjects do not match. access_sub=%s id_sub=%s",
            access_payload.sub,
            id_payload.sub,
        )
        raise Auth0TokenError("Auth0 token subjects do not match")

    if not id_payload.email_verified:
        logger.error("Auth0 email is not verified. sub=%s", id_payload.sub)
        raise Auth0TokenError("Auth0 email is not verified")

    return id_payload


class Auth0Provider:
    key = "auth0"

    def verify_tokens(self, access_token: str, id_token: str) -> Auth0UserPayload:
        return verify_auth0_tokens(access_token, id_token)


AUTH0_PROVIDER = Auth0Provider()
