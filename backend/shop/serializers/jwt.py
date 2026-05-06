from pydantic import BaseModel, ConfigDict, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str


class AccessTokenPayload(BaseModel):
    sub: str
    email: EmailStr | None = None
    exp: int


class Auth0AccessTokenPayload(AccessTokenPayload):
    model_config = ConfigDict(extra="allow")

    iss: str
    aud: str | list[str]
    email: EmailStr | None = None
    email_ns: EmailStr | None = None
