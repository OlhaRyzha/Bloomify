from unittest.mock import Mock, patch

from django.contrib.auth.models import User
from django.test import TestCase, override_settings

from shop.services.auth0 import (
    Auth0ConfigurationError,
    Auth0TokenError,
    Auth0UserPayload,
    _decode_auth0_token,
)
from shop.services.identity_providers import get_identity_provider
from shop.tests.factories import (
    TEST_AUTH0_ACCESS_TOKEN,
    TEST_AUTH0_ID_TOKEN,
    TEST_AUTH0_SUBJECT,
    TEST_USER_EMAIL,
    TEST_USER_NAME,
    build_auth0_login_payload,
    build_login_payload,
    build_register_payload,
    create_test_user,
)
from shop.views.auth import AUTH_REFRESH_COOKIE_NAME


class AuthApiTest(TestCase):
    def test_identity_provider_registry_returns_auth0_provider(self):
        self.assertEqual(get_identity_provider("auth0").key, "auth0")

    @override_settings(
        AUTH0_ALGORITHMS=["RS256", "RS512"],
        AUTH0_DOMAIN="example.auth0.com",
        AUTH0_ISSUER="https://example.auth0.com/",
    )
    @patch("shop.services.auth0.jwt.decode")
    @patch("shop.services.auth0.jwt.PyJWKClient")
    def test_auth0_decode_uses_configured_algorithms(
        self,
        jwks_client_class,
        decode_token,
    ):
        signing_key = Mock()
        signing_key.key = "public-key"
        jwks_client = Mock()
        jwks_client.get_signing_key_from_jwt.return_value = signing_key
        jwks_client_class.return_value = jwks_client
        decode_token.return_value = {"sub": "auth0|123"}

        payload = _decode_auth0_token("token", audience="api")

        self.assertEqual(payload, {"sub": "auth0|123"})
        decode_token.assert_called_once_with(
            "token",
            "public-key",
            algorithms=["RS256", "RS512"],
            audience="api",
            issuer="https://example.auth0.com/",
        )

    @override_settings(
        AUTH0_ALGORITHMS=[],
        AUTH0_DOMAIN="example.auth0.com",
        AUTH0_ISSUER="https://example.auth0.com/",
    )
    @patch("shop.services.auth0.jwt.PyJWKClient")
    def test_auth0_decode_rejects_missing_algorithms(self, jwks_client_class):
        signing_key = Mock()
        signing_key.key = "public-key"
        jwks_client = Mock()
        jwks_client.get_signing_key_from_jwt.return_value = signing_key
        jwks_client_class.return_value = jwks_client

        with self.assertRaises(Auth0ConfigurationError):
            _decode_auth0_token("token", audience="api")

    def test_register_creates_user_and_sets_refresh_cookie(self):
        response = self.client.post(
            "/auth/register/",
            data=build_register_payload(),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("access_token", response.json())
        self.assertIn(AUTH_REFRESH_COOKIE_NAME, response.cookies)
        refresh_cookie = response.cookies[AUTH_REFRESH_COOKIE_NAME]
        self.assertTrue(refresh_cookie["httponly"])
        self.assertEqual(refresh_cookie["samesite"], "Lax")

        user = User.objects.get(email=TEST_USER_EMAIL)
        self.assertEqual(user.username, TEST_USER_EMAIL)
        self.assertEqual(user.first_name, TEST_USER_NAME)

    def test_register_rejects_duplicate_email(self):
        create_test_user()

        response = self.client.post(
            "/auth/register/",
            data=build_register_payload(email=TEST_USER_EMAIL.upper()),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_login_sets_refresh_cookie(self):
        create_test_user()

        response = self.client.post(
            "/auth/token/",
            data=build_login_payload(),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn(AUTH_REFRESH_COOKIE_NAME, response.cookies)

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            "/auth/token/",
            data=build_login_payload(password="wrong-password"),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_refresh_uses_refresh_cookie(self):
        create_test_user()
        login_response = self.client.post(
            "/auth/token/",
            data=build_login_payload(),
            content_type="application/json",
        )
        self.client.cookies[AUTH_REFRESH_COOKIE_NAME] = login_response.cookies[
            AUTH_REFRESH_COOKIE_NAME
        ].value

        response = self.client.post("/auth/refresh/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())

    def test_refresh_rejects_missing_cookie(self):
        response = self.client.post("/auth/refresh/")

        self.assertEqual(response.status_code, 401)

    def test_logout_deletes_refresh_cookie(self):
        response = self.client.post("/auth/logout/")

        self.assertEqual(response.status_code, 204)
        self.assertIn(AUTH_REFRESH_COOKIE_NAME, response.cookies)
        self.assertEqual(response.cookies[AUTH_REFRESH_COOKIE_NAME].value, "")

    def test_me_returns_current_user(self):
        user = create_test_user()
        login_response = self.client.post(
            "/auth/token/",
            data=build_login_payload(),
            content_type="application/json",
        )
        access_token = login_response.json()["access_token"]

        response = self.client.get(
            "/auth/me/",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": user.pk,
                "email": TEST_USER_EMAIL,
                "name": TEST_USER_NAME,
            },
        )

    @patch("shop.services.auth0.AUTH0_PROVIDER.verify_tokens")
    def test_auth0_login_creates_user_and_sets_refresh_cookie(self, verify_tokens):
        verify_tokens.return_value = Auth0UserPayload(
            sub=TEST_AUTH0_SUBJECT,
            email=TEST_USER_EMAIL,
            name=TEST_USER_NAME,
            email_verified=True,
        )

        response = self.client.post(
            "/auth/oauth/auth0/",
            data=build_auth0_login_payload(),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn(AUTH_REFRESH_COOKIE_NAME, response.cookies)
        user = User.objects.get(email=TEST_USER_EMAIL)
        self.assertEqual(user.username, TEST_USER_EMAIL)
        self.assertEqual(user.first_name, TEST_USER_NAME)
        self.assertFalse(user.has_usable_password())

    @patch("shop.services.auth0.AUTH0_PROVIDER.verify_tokens")
    def test_auth0_login_reuses_existing_email_user(self, verify_tokens):
        user = create_test_user(name="")
        verify_tokens.return_value = Auth0UserPayload(
            sub=TEST_AUTH0_SUBJECT,
            email=TEST_USER_EMAIL.upper(),
            name=TEST_USER_NAME,
            email_verified=True,
        )

        response = self.client.post(
            "/auth/oauth/auth0/",
            data=build_auth0_login_payload(),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.filter(email=TEST_USER_EMAIL).count(), 1)
        user.refresh_from_db()
        self.assertEqual(user.first_name, TEST_USER_NAME)

    @patch("shop.services.auth0.AUTH0_PROVIDER.verify_tokens")
    def test_auth0_login_rejects_invalid_token(self, verify_tokens):
        verify_tokens.side_effect = Auth0TokenError("invalid")

        response = self.client.post(
            "/auth/oauth/auth0/",
            data=build_auth0_login_payload(
                access_token=f"bad-{TEST_AUTH0_ACCESS_TOKEN}",
                id_token=f"bad-{TEST_AUTH0_ID_TOKEN}",
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)
