import random
from src.common import db, security
from src.common.api import ApiError, endpoint, response

_INVALID_TOKEN = {"detail": "Token is invalid or expired", "code": "token_not_valid"}


@endpoint()
def login(req):
    body = req.json()
    username, password = body.get("username"), body.get("password")

    if not username or not password or not isinstance(username, str) or not isinstance(password, str):
        raise ApiError(400, {"error": "Username y password son obligatorios."})

    user = db.fetch_one(
        "SELECT id, username, password, is_active FROM auth_user WHERE username = %s",
        (username,),
    )
    valid = security.check_password(password, user["password"] if user else security.DUMMY_HASH)

    if not user or not valid or not user["is_active"]:
        raise ApiError(401, {"error": "Invalid credentials"})

    return response(200, {
        "access": security.issue_access(user["id"]),
        "refresh": security.issue_refresh(user["id"]),
        "user": {"id": user["id"], "username": user["username"]},
    })


@endpoint()
def refresh(req):
    token = req.json().get("refresh")
    if not token or not isinstance(token, str):
        raise ApiError(400, {"refresh": ["This field is required."]})

    try:
        payload = security.decode_token(token, "refresh")
    except security.TokenError:
        raise ApiError(401, _INVALID_TOKEN)

    user = db.fetch_one("SELECT is_active FROM auth_user WHERE id = %s", (payload["user_id"],))
    if not user or not user["is_active"]:
        raise ApiError(401, _INVALID_TOKEN)

    if not security.blacklist(payload["jti"], payload["exp"]):
        raise ApiError(401, _INVALID_TOKEN)

    return response(200, {
        "access": security.issue_access(payload["user_id"]),
        "refresh": security.issue_refresh(payload["user_id"]),
    })


@endpoint(auth=True)
def logout(req):
    token = req.json().get("refresh")
    if not token or not isinstance(token, str):
        raise ApiError(400, {"error": "Refresh token es obligatorio."})

    try:
        payload = security.decode_token(token, "refresh")
    except security.TokenError:
        raise ApiError(400, {"error": "Refresh token inválido o expirado."})

    if payload["user_id"] != req.user_id or not security.blacklist(payload["jti"], payload["exp"]):
        raise ApiError(400, {"error": "Refresh token inválido o expirado."})

    return response(200, {"message": "Sesión cerrada correctamente."})
