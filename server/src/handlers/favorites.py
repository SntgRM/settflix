from datetime import datetime, timezone

import pymysql

from src.common import db, omdb
from src.common.api import ApiError, endpoint, response

_COLUMNS = "id, id_pelicula, titulo, anio, poster, nota, fecha_agregado"

_ORDERING = {
    "fecha_agregado": "fecha_agregado ASC",
    "-fecha_agregado": "fecha_agregado DESC",
    "anio": "anio ASC",
    "-anio": "anio DESC",
    "nota": "nota ASC",
    "-nota": "nota DESC",
    "titulo": "titulo ASC",
    "-titulo": "titulo DESC",
}
_DEFAULT_ORDERING = "fecha_agregado DESC"


def _serialize(row):
    out = dict(row)
    out["fecha_agregado"] = row["fecha_agregado"].isoformat() + "Z"
    return out


def _validate_nota(value):
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, str)):
        raise ApiError(400, {"nota": ["A valid integer is required."]})
    try:
        value = int(value)
    except ValueError:
        raise ApiError(400, {"nota": ["A valid integer is required."]})
    if not 1 <= value <= 5:
        raise ApiError(400, {"nota": ["La nota debe estar entre 1 y 5."]})
    return value


def _validate_id_pelicula(value):
    if value is None:
        raise ApiError(400, {"id_pelicula": ["This field may not be null."]})
    if not isinstance(value, str):
        raise ApiError(400, {"id_pelicula": ["Not a valid string."]})
    value = value.strip()
    if not value:
        raise ApiError(400, {"id_pelicula": ["This field may not be blank."]})
    if len(value) > 20:
        raise ApiError(400, {"id_pelicula": ["Ensure this field has no more than 20 characters."]})
    return value


def _not_found():
    return ApiError(404, {"detail": "Not found."})


# ── /api/favorites/  (GET lista · POST crea) ─────────────────────────────────
@endpoint(auth=True)
def collection(req):
    return _list(req) if req.method == "GET" else _create(req)


def _list(req):
    where, args = ["usuario_id = %s"], [req.user_id]
    q = req.query

    if q.get("anio"):
        where.append("anio = %s")
        args.append(q["anio"])
    for param, op in (("nota_min", ">="), ("nota_max", "<=")):
        if q.get(param):
            try:
                value = int(q[param])
            except ValueError:
                continue
            where.append(f"nota {op} %s")
            args.append(value)

    order = _ORDERING.get(q.get("ordering"), _DEFAULT_ORDERING)
    rows = db.fetch_all(
        f"SELECT {_COLUMNS} FROM favoritas WHERE {' AND '.join(where)} ORDER BY {order}, id DESC",
        args,
    )
    return response(200, [_serialize(r) for r in rows])


def _create(req):
    body = req.json()
    id_pelicula = _validate_id_pelicula(body.get("id_pelicula"))
    nota = _validate_nota(body.get("nota"))

    if db.fetch_one(
        "SELECT id FROM favoritas WHERE usuario_id = %s AND id_pelicula = %s",
        (req.user_id, id_pelicula),
    ):
        raise ApiError(409, {"error": "Esta película ya está en tus favoritas."})

    try:
        pelicula = omdb.obtener_pelicula_por_id(id_pelicula)
    except omdb.OMDbNotFoundError as exc:
        raise ApiError(404, {"error": str(exc)})
    except omdb.OMDbServiceError as exc:
        raise ApiError(502, {"error": str(exc)})

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    values = {
        "id_pelicula": (pelicula["id_pelicula"] or id_pelicula)[:20],
        "titulo": (pelicula["titulo"] or "")[:255],
        "anio": (pelicula["anio"] or None) and pelicula["anio"][:10],
        "poster": (pelicula["poster"] or None) and pelicula["poster"][:500],
    }
    try:
        _, new_id = db.execute(
            "INSERT INTO favoritas (usuario_id, id_pelicula, titulo, anio, poster, nota, fecha_agregado) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (req.user_id, values["id_pelicula"], values["titulo"], values["anio"],
             values["poster"], nota, now),
        )
    except pymysql.err.IntegrityError:
        raise ApiError(409, {"error": "Esta película ya está en tus favoritas."})

    return response(201, _serialize({
        "id": new_id, **values, "nota": nota, "fecha_agregado": now,
    }))


# ── /api/favorites/{id}/  (GET · PUT/PATCH · DELETE) ─────────────────────────
@endpoint(auth=True)
def detail(req):
    raw_id = req.path_params.get("id", "")
    if not raw_id.isdigit():
        raise _not_found()
    fav_id = int(raw_id)

    row = db.fetch_one(
        f"SELECT {_COLUMNS} FROM favoritas WHERE id = %s AND usuario_id = %s",
        (fav_id, req.user_id),
    )
    if not row:
        raise _not_found()

    method = req.method
    if method == "GET":
        return response(200, _serialize(row))

    if method == "DELETE":
        db.execute("DELETE FROM favoritas WHERE id = %s", (fav_id,))
        return response(204)

    # PUT / PATCH: solo se puede cambiar la nota (devuelve {id, nota} como en Django).
    body = req.json()
    if "nota" in body:
        nota = _validate_nota(body["nota"])
        db.execute("UPDATE favoritas SET nota = %s WHERE id = %s", (nota, fav_id))
    else:
        nota = row["nota"]
    return response(200, {"id": fav_id, "nota": nota})
