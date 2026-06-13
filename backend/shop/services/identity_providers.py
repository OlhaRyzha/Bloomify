from shop.services.auth0 import AUTH0_PROVIDER
from shop.services.identity_provider_types import (
    IdentityProvider,
    IdentityProviderConfigurationError,
)


def get_identity_provider(provider_key: str) -> IdentityProvider:
    if provider_key == "auth0":
        return AUTH0_PROVIDER

    raise IdentityProviderConfigurationError(
        f"Unsupported identity provider: {provider_key}"
    )
