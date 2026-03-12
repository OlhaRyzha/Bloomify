from django.contrib.auth.hashers import check_password, make_password


def hash_password(password: str) -> str:
    return make_password(password)


def verify_password_hash(plain_password: str, hashed_password: str) -> bool:
    return check_password(plain_password, hashed_password)
