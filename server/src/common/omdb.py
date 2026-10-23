import json
import socket
import urllib.error
import urllib.parse
import urllib.request

from src.common import cache, config


class OMDbServiceError(Exception):
    pass


class OMDbNotFoundError(Exception):
    pass


def _request(params, not_found_message):
    api_key = config.omdb_api_key()
    if not api_key:
        raise OMDbServiceError("La API externa no está configurada (falta OMDB_API_KEY).")

    url = f"{config.OMDB_BASE_URL}?{urllib.parse.urlencode({**params, 'apikey': api_key})}"
    try:
        with urllib.request.urlopen(url, timeout=config.OMDB_TIMEOUT) as resp:
            raw = resp.read()
    except urllib.error.HTTPError:
        raise OMDbServiceError("La API externa respondió con un error.")
    except (TimeoutError, socket.timeout):
        raise OMDbServiceError("La API externa tardó demasiado en responder.")
    except urllib.error.URLError as exc:
        if isinstance(exc.reason, (TimeoutError, socket.timeout)):
            raise OMDbServiceError("La API externa tardó demasiado en responder.")
        raise OMDbServiceError("No se pudo conectar con la API externa.")
    except Exception:
        raise OMDbServiceError("Error inesperado al consultar la API externa.")

    try:
        data = json.loads(raw)
    except ValueError:
        raise OMDbServiceError("La API externa devolvió una respuesta inválida.")

    if data.get("Response") == "False":
        raise OMDbNotFoundError(data.get("Error", not_found_message))
    return data


def buscar_peliculas(query, page=1):
    if not query or not query.strip():
        raise OMDbServiceError("El término de búsqueda no puede estar vacío.")

    q = query.strip().lower()
    cache_key = f"search:{q}:{page}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        data = _request({"s": q, "page": page}, "No se encontraron resultados.")
    except OMDbNotFoundError:
        result = {"resultados": [], "total": 0, "pagina": int(page)}
        cache.set(cache_key, result, config.OMDB_CACHE_TTL)
        return result

    resultados = [
        {
            "id_pelicula": item.get("imdbID"),
            "titulo": item.get("Title"),
            "anio": item.get("Year"),
            "poster": item.get("Poster"),
        }
        for item in data.get("Search", [])
    ]
    try:
        total = int(data.get("totalResults", 0))
    except (TypeError, ValueError):
        total = len(resultados)

    result = {"resultados": resultados, "total": total, "pagina": int(page)}
    cache.set(cache_key, result, config.OMDB_CACHE_TTL)
    return result


def obtener_pelicula_por_id(id_pelicula):
    if not id_pelicula:
        raise OMDbServiceError("El id de la película es obligatorio.")

    cache_key = f"detail:{id_pelicula}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    data = _request({"i": id_pelicula}, "Película no encontrada.")
    result = {
        "id_pelicula": data.get("imdbID"),
        "titulo": data.get("Title"),
        "anio": data.get("Year"),
        "poster": data.get("Poster"),
    }
    cache.set(cache_key, result, config.OMDB_CACHE_TTL)
    return result
