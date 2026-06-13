from typing import Protocol

from pydantic import BaseModel


class IdentityProviderConfigurationError(RuntimeError):
    pass


class IdentityProviderTokenError(RuntimeError):
    pass


class ExternalIdentityPayload(BaseModel):
    sub: str
    email: str
    name: str = ""
    email_verified: bool = False


class IdentityProvider(Protocol):
    key: str

    def verify_tokens(
        self, access_token: str, id_token: str
    ) -> ExternalIdentityPayload: ...
