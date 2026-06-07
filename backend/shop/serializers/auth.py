from django.contrib.auth import authenticate
from django.contrib.auth.models import AbstractBaseUser, User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class AuthTokenResponseSerializer(serializers.Serializer):
    access_token = serializers.CharField()


class Auth0LoginSerializer(serializers.Serializer):
    accessToken = serializers.CharField()
    idToken = serializers.CharField()


class CurrentUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    name = serializers.CharField(allow_blank=True)


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value: str) -> str:
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized_email

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        name = validated_data["name"].strip()
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=name,
        )
        assert isinstance(user, AbstractBaseUser)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        password = attrs["password"]
        user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")

        attrs["user"] = user
        return attrs
