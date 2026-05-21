from odoo.http import request
from odoo.tools import config


DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:3000",
    "http://localhost:5173",
)


def _normalize_origin(value):
    return (value or "").strip().rstrip("/")


def _split_origins(value):
    if not value:
        return []
    return [
        normalized
        for item in str(value).split(",")
        if (normalized := _normalize_origin(item))
    ]


def get_allowed_origins():
    origins = []

    origins.extend(_split_origins(config.get("cors_allowed_origins")))

    configured_cors = _normalize_origin(config.get("cors"))
    if configured_cors and configured_cors != "*":
        origins.extend(_split_origins(configured_cors))

    origins.extend(DEFAULT_ALLOWED_ORIGINS)

    unique_origins = []
    seen = set()
    for origin in origins:
        if origin not in seen:
            unique_origins.append(origin)
            seen.add(origin)
    return unique_origins


def get_request_origin():
    return _normalize_origin(request.httprequest.headers.get("Origin"))


def resolve_allowed_origin(origin=None):
    candidate = _normalize_origin(origin or get_request_origin())
    if not candidate:
        return None
    return candidate if candidate in get_allowed_origins() else None


def build_cors_headers(*, content_type="application/json", expose_headers=None):
    request_origin = get_request_origin()
    allowed_origin = resolve_allowed_origin(request_origin)

    headers = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": (
            "Content-Type, Authorization, Accept, Origin, X-Requested-With, X-CSRFToken"
        ),
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
    }

    if content_type:
        headers["Content-Type"] = content_type
    if expose_headers:
        headers["Access-Control-Expose-Headers"] = expose_headers

    if allowed_origin:
        headers["Access-Control-Allow-Origin"] = allowed_origin
        headers["Access-Control-Allow-Credentials"] = "true"
    elif not request_origin:
        headers["Access-Control-Allow-Origin"] = "*"

    return headers
