import functools
import json
import logging

from src.common import security

log = logging.getLogger("settflix")
log.setLevel(logging.INFO)


class ApiError(Exception):

    def __init__(self, status, body):
        super().__init__(status)
        self.status = status
        self.body = body


def response(status, body=None):
    res = {"statusCode": status, "headers": {"Content-Type": "application/json"}}
    if body is not None:
        res["body"] = json.dumps(body, ensure_ascii=False, separators=(",", ":"))
    return res


class Request:

    def __init__(self, event):
        self.event = event
        self.user_id = None
        self._json = None

    @property
    def method(self):
        return self.event["requestContext"]["http"]["method"]

    @property
    def query(self):
        return self.event.get("queryStringParameters") or {}

    @property
    def path_params(self):
        return self.event.get("pathParameters") or {}

    def header(self, name):
        name = name.lower()
        for key, value in (self.event.get("headers") or {}).items():
            if key.lower() == name:
                return value
        return ""

    def json(self):
        if self._json is None:
            raw = self.event.get("body")
            if raw and self.event.get("isBase64Encoded"):
                import base64
                raw = base64.b64decode(raw).decode("utf-8")
            if not raw:
                self._json = {}
            else:
                try:
                    data = json.loads(raw)
                except ValueError:
                    raise ApiError(400, {"detail": "JSON parse error"})
                if not isinstance(data, dict):
                    raise ApiError(400, {"non_field_errors": ["Invalid data. Expected a dictionary."]})
                self._json = data
        return self._json


def _authenticate(req):
    """≈ permission_classes = [IsAuthenticated] + JWTAuthentication."""
    parts = req.header("authorization").split()
    if len(parts) != 2 or parts[0] != "Bearer":
        raise ApiError(401, {"detail": "Authentication credentials were not provided."})
    try:
        req.user_id = security.decode_token(parts[1], "access")["user_id"]
    except security.TokenError:
        raise ApiError(401, {
            "detail": "Given token not valid for any token type",
            "code": "token_not_valid",
        })


def endpoint(auth=False):
    """Decorador que convierte una función(req) en un handler de Lambda.

    - auth=True exige un access token válido (401 si no).
    - Convierte ApiError en respuesta y cualquier otro fallo en un 500 genérico
      (el detalle va al log, nunca al cliente).
    """

    def decorator(fn):
        @functools.wraps(fn)
        def lambda_handler(event, context=None):
            req = Request(event)
            try:
                if auth:
                    _authenticate(req)
                return fn(req)
            except ApiError as exc:
                return response(exc.status, exc.body)
            except Exception:
                log.exception("Error no controlado")
                return response(500, {"error": "Error interno del servidor."})

        return lambda_handler

    return decorator
