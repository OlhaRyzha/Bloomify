from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase

from shop.services.auth0 import Auth0TokenError, Auth0UserPayload
from shop.views.auth import AUTH_REFRESH_COOKIE_NAME


class AuthApiTest(TestCase):
    def test_register_creates_user_and_sets_refresh_cookie(self):
        response = self.client.post(
            "/auth/register/",
            data={
                "name": "Olha Ryzha",
                "email": "olha@example.com",
                "password": "BloomifyAuth123!",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("access_token", response.json())
        self.assertIn(AUTH_REFRESH_COOKIE_NAME, response.cookies)
        refresh_cookie = response.cookies[AUTH_REFRESH_COOKIE_NAME]
        self.assertTrue(refresh_cookie["httponly"])
        self.assertEqual(refresh_cookie["samesite"], "Lax")

        user = User.objects.get(email="olha@example.com")
        self.assertEqual(user.username, "olha@example.com")
        self.assertEqual(user.first_name, "Olha Ryzha")

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(
            username="olha@example.com",
            email="olha@example.com",
            password="BloomifyAuth123!",
        )

        response = self.client.post(
            "/auth/register/",
            data={
                "name": "Olha Ryzha",
                "email": "OLHA@example.com",
                "password": "BloomifyAuth123!",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_login_sets_refresh_cookie(self):
        User.objects.create_user(
            username="olha@example.com",
            email="olha@example.com",
            password="BloomifyAuth123!",
        )

        response = self.client.post(
            "/auth/token/",
            data={
                "email": "olha@example.com",
                "password": "BloomifyAuth123!",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn(AUTH_REFRESH_COOKIE_NAME, response.cookies)

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            "/auth/token/",
            data={
                "email": "olha@example.com",
                "password": "wrong-password",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_refresh_uses_refresh_cookie(self):
        User.objects.create_user(
            username="olha@example.com",
            email="olha@example.com",
            password="BloomifyAuth123!",
        )
        login_response = self.client.post(
            "/auth/token/",
            data={
                "email": "olha@example.com",
                "password": "BloomifyAuth123!",
            },
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
        user = User.objects.create_user(
            username="olha@example.com",
            email="olha@example.com",
            password="BloomifyAuth123!",
            first_name="Olha Ryzha",
        )
        login_response = self.client.post(
            "/auth/token/",
            data={
                "email": "olha@example.com",
                "password": "BloomifyAuth123!",
            },
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
                "email": "olha@example.com",
                "name": "Olha Ryzha",
            },
        )

    @patch("shop.views.auth.verify_auth0_tokens")
    def test_auth0_login_creates_user_and_sets_refresh_cookie(self, verify_auth0):
        verify_auth0.return_value = Auth0UserPayload(
            sub="google-oauth2|123",
            email="olha@example.com",
            name="Olha Ryzha",
            email_verified=True,
        )

        response = self.client.post(
            "/auth/oauth/auth0/",
            data={
                "accessToken": "auth0-access-token",
                "idToken": "auth0-id-token",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertIn(AUTH_REFRESH_COOKIE_NAME, response.cookies)
        user = User.objects.get(email="olha@example.com")
        self.assertEqual(user.username, "olha@example.com")
        self.assertEqual(user.first_name, "Olha Ryzha")
        self.assertFalse(user.has_usable_password())

    @patch("shop.views.auth.verify_auth0_tokens")
    def test_auth0_login_reuses_existing_email_user(self, verify_auth0):
        user = User.objects.create_user(
            username="olha@example.com",
            email="olha@example.com",
            password="BloomifyAuth123!",
        )
        verify_auth0.return_value = Auth0UserPayload(
            sub="google-oauth2|123",
            email="OLHA@example.com",
            name="Olha Ryzha",
            email_verified=True,
        )

        response = self.client.post(
            "/auth/oauth/auth0/",
            data={
                "accessToken": "auth0-access-token",
                "idToken": "auth0-id-token",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.filter(email="olha@example.com").count(), 1)
        user.refresh_from_db()
        self.assertEqual(user.first_name, "Olha Ryzha")

    @patch("shop.views.auth.verify_auth0_tokens")
    def test_auth0_login_rejects_invalid_token(self, verify_auth0):
        verify_auth0.side_effect = Auth0TokenError("invalid")

        response = self.client.post(
            "/auth/oauth/auth0/",
            data={
                "accessToken": "bad-token",
                "idToken": "bad-id-token",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)
