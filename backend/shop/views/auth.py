from typing import cast

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, User
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken, Token

from shop.serializers.auth import (
    Auth0LoginSerializer,
    AuthTokenResponseSerializer,
    CurrentUserSerializer,
    LoginSerializer,
    RegisterSerializer,
)
from shop.services.auth0 import (
    Auth0ConfigurationError,
    Auth0TokenError,
    verify_auth0_tokens,
)

AUTH_REFRESH_COOKIE_NAME = "bloomify_refresh"
AUTH_REFRESH_COOKIE_PATH = "/"


def build_access_response(user: AbstractBaseUser) -> tuple[dict[str, str], str]:
    refresh = RefreshToken.for_user(user)
    return {"access_token": str(refresh.access_token)}, str(refresh)


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        AUTH_REFRESH_COOKIE_NAME,
        refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path=AUTH_REFRESH_COOKIE_PATH,
    )


def delete_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        AUTH_REFRESH_COOKIE_NAME,
        path=AUTH_REFRESH_COOKIE_PATH,
        samesite="Lax",
    )


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register"

    @extend_schema(
        request=RegisterSerializer,
        responses={201: AuthTokenResponseSerializer},
    )
    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        access_payload, refresh_token = build_access_response(user)
        response = Response(access_payload, status=status.HTTP_201_CREATED)
        set_refresh_cookie(response, refresh_token)
        return response


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"

    @extend_schema(
        request=LoginSerializer,
        responses={200: AuthTokenResponseSerializer},
    )
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        access_payload, refresh_token = build_access_response(user)
        response = Response(access_payload)
        set_refresh_cookie(response, refresh_token)
        return response


class RefreshView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_refresh"

    @extend_schema(
        request=None,
        responses={200: AuthTokenResponseSerializer},
    )
    def post(self, request: Request) -> Response:
        raw_refresh_token = request.COOKIES.get(AUTH_REFRESH_COOKIE_NAME)
        if not raw_refresh_token:
            return Response(
                {"detail": "Refresh session is missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(cast(Token, raw_refresh_token))
        except TokenError:
            response = Response(
                {"detail": "Refresh session is invalid."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            delete_refresh_cookie(response)
            return response

        return Response({"access_token": str(refresh.access_token)})


class Auth0LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"

    @extend_schema(
        request=Auth0LoginSerializer,
        responses={200: AuthTokenResponseSerializer},
    )
    def post(self, request: Request) -> Response:
        serializer = Auth0LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        access_token = serializer.validated_data["accessToken"]
        id_token = serializer.validated_data["idToken"]

        try:
            auth0_user = verify_auth0_tokens(access_token, id_token)
        except Auth0ConfigurationError:
            return Response(
                {"detail": "Auth0 is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Auth0TokenError:
            return Response(
                {"detail": "Invalid Auth0 access token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = str(auth0_user.email).lower()
        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=None,
                first_name=auth0_user.name,
            )
        elif auth0_user.name and not user.first_name:
            user.first_name = auth0_user.name
            user.save(update_fields=["first_name"])

        access_payload, refresh_token = build_access_response(user)
        response = Response(access_payload)
        set_refresh_cookie(response, refresh_token)
        return response


class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=None, responses={204: None})
    def post(self, request: Request) -> Response:
        response = Response(status=status.HTTP_204_NO_CONTENT)
        delete_refresh_cookie(response)
        return response


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses={200: CurrentUserSerializer})
    def get(self, request: Request) -> Response:
        user = request.user
        if not isinstance(user, User):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        name = user.get_full_name() or user.get_username()
        return Response(
            {
                "id": user.pk,
                "email": user.email,
                "name": name,
            }
        )
