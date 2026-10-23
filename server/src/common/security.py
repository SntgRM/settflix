import base64
import hashlib
import hmac
import random
import secrets
import time
import uuid

import jwt

from src.common import config, db

DJANGO_ITERATIONS = 1_000_000  # default de Django 5.2

DUMMY_HASH = "pbkdf2_sha256$1000000$dummysalt$" + "A" * 43 + "="


def make_password(raw, iterations=DJANGO_ITERATIONS):
    salt = secrets.token_urlsafe(12)[:12]
    digest = hashlib.pbkdf2_hmac("sha256", raw.encode(), salt.encode(), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${base64.b64encode(digest).decode()}"


def check_password(raw, encoded):
    try:
        algorithm, iterations, salt, expected = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac("sha256", raw.encode(), salt.encode(), int(iterations))
    except (ValueError, AttributeError):
        return False
    return hmac.compare_digest(base64.b64encode(digest).decode(), expected)


class TokenError(Exception):
    pass


def _issue(token_type, user_id, lifetime):
    now = int(time.time())
    payload = {
        "token_type": token_type,
        "exp": now + lifetime,
        "iat": now,
        "jti": uuid.uuid4().hex,
        "user_id": user_id,
    }
    return jwt.encode(payload, config.SECRET_KEY, algorithm="HS256")


def issue_access(user_id):
    return _issue("access", user_id, config.ACCESS_TOKEN_LIFETIME)


def issue_refresh(user_id):
    return _issue("refresh", user_id, config.REFRESH_TOKEN_LIFETIME)


def decode_token(token, expected_type):
    try:
        payload = jwt.decode(
            token,
            config.SECRET_KEY,
            algorithms=["HS256"],
            options={"require": ["exp", "jti", "token_type", "user_id"]},
        )
        if payload["token_type"] != expected_type:
            raise TokenError("Tipo de token incorrecto")
        payload["user_id"] = int(payload["user_id"])
        return payload
    except (jwt.PyJWTError, ValueError, TypeError) as exc:
        raise TokenError(str(exc)) from exc


def blacklist(jti, exp_timestamp):
    inserted, _ = db.execute(
        "INSERT IGNORE INTO jwt_blacklist (jti, expires_at) "
        "VALUES (%s, DATE_ADD('1970-01-01', INTERVAL %s SECOND))",
        (jti, exp_timestamp),
    )
    if random.random() < 0.05:
        db.execute("DELETE FROM jwt_blacklist WHERE expires_at < UTC_TIMESTAMP() LIMIT 100")
    return inserted == 1
