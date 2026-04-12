from datetime import datetime, timedelta

from odoo import _
from odoo.tools import config

try:
    import jwt
except ImportError:  # pragma: no cover
    jwt = None

SECRET_KEY = config.get("jwt_secret") or config.get("admin_passwd") or "condome-secret"
ALGORITHM = "HS256"
ACCESS_MINUTES = int(config.get("jwt_access_minutes") or 60)
REFRESH_DAYS = int(config.get("jwt_refresh_days") or 30)


class TokenError(Exception):
    pass


def _now():
    return datetime.utcnow()


def _build_payload(user_id, token_type, expires_in):
    return {
        "sub": int(user_id),
        "type": token_type,
        "iat": _now(),
        "exp": expires_in,
    }


def _encode(payload):
    if jwt is None:
        raise TokenError(_("PyJWT no está instalado"))
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode(token):
    if jwt is None:
        raise TokenError(_("PyJWT no está instalado"))
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise TokenError(_("El token ha expirado"))
    except jwt.InvalidTokenError:
        raise TokenError(_("Token inválido"))


def build_tokens(user):
    now = _now()
    access_exp = now + timedelta(minutes=ACCESS_MINUTES)
    refresh_exp = now + timedelta(days=REFRESH_DAYS)

    access_payload = _build_payload(user.id, "access", access_exp)
    refresh_payload = _build_payload(user.id, "refresh", refresh_exp)

    return {
        "access_token": _encode(access_payload),
        "refresh_token": _encode(refresh_payload),
        "expires_in": ACCESS_MINUTES * 60,
    }


def verify_token(token, expected_type=None):
    payload = _decode(token)
    if expected_type and payload.get("type") != expected_type:
        raise TokenError(_("Tipo de token inválido"))
    return payload
