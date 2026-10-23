from src.common import omdb
from src.common.api import ApiError, endpoint, response


@endpoint(auth=True)
def search(req):
    query = (req.query.get("q") or "").strip()
    if not query:
        raise ApiError(400, {"error": 'El parámetro "q" es obligatorio.'})

    try:
        page = int(req.query.get("page", 1))
    except (TypeError, ValueError):
        raise ApiError(400, {"error": 'El parámetro "page" debe ser un número entero.'})
    if not 1 <= page <= 100:
        raise ApiError(400, {"error": 'El parámetro "page" debe estar entre 1 y 100.'})

    try:
        return response(200, omdb.buscar_peliculas(query, page))
    except omdb.OMDbServiceError as exc:
        raise ApiError(502, {"error": str(exc)})
