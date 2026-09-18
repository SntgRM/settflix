import os
import requests

OMDB_BASE_URL = 'https://www.omdbapi.com/'
TIMEOUT = 5


class OMDbServiceError(Exception):
    pass


def buscar_peliculas(query, page=1):
    api_key = os.getenv('OMDB_API_KEY')

    if not api_key:
        raise OMDbServiceError('La API externa no está configurada (falta OMDB_API_KEY).')

    if not query or not query.strip():
        raise OMDbServiceError('El término de búsqueda no puede estar vacío.')

    params = {
        'apikey': api_key,
        's': query.strip(),
        'page': page,
    }

    try:
        response = requests.get(OMDB_BASE_URL, params=params, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise OMDbServiceError('La API externa tardó demasiado en responder.')
    except requests.exceptions.ConnectionError:
        raise OMDbServiceError('No se pudo conectar con la API externa.')
    except requests.exceptions.HTTPError:
        raise OMDbServiceError('La API externa respondió con un error.')
    except requests.exceptions.RequestException:
        raise OMDbServiceError('Error inesperado al consultar la API externa.')

    try:
        data = response.json()
    except ValueError:
        raise OMDbServiceError('La API externa devolvió una respuesta inválida.')

    if data.get('Response') == 'False':
        raise OMDbServiceError(data.get('Error', 'No se encontraron resultados.'))

    resultados = [
        {
            'id_pelicula': item.get('imdbID'),
            'titulo': item.get('Title'),
            'anio': item.get('Year'),
            'poster': item.get('Poster'),
        }
        for item in data.get('Search', [])
    ]

    try:
        total = int(data.get('totalResults', 0))
    except (TypeError, ValueError):
        total = len(resultados)

    return {
        'resultados': resultados,
        'total': total,
        'pagina': int(page),
    }


def obtener_pelicula_por_id(id_pelicula):
    api_key = os.getenv('OMDB_API_KEY')

    if not api_key:
        raise OMDbServiceError('La API externa no está configurada (falta OMDB_API_KEY).')

    if not id_pelicula:
        raise OMDbServiceError('El id de la película es obligatorio.')

    params = {
        'apikey': api_key,
        'i': id_pelicula,
    }

    try:
        response = requests.get(OMDB_BASE_URL, params=params, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise OMDbServiceError('La API externa tardó demasiado en responder.')
    except requests.exceptions.ConnectionError:
        raise OMDbServiceError('No se pudo conectar con la API externa.')
    except requests.exceptions.RequestException:
        raise OMDbServiceError('Error inesperado al consultar la API externa.')

    try:
        data = response.json()
    except ValueError:
        raise OMDbServiceError('La API externa devolvió una respuesta inválida.')

    if data.get('Response') == 'False':
        raise OMDbServiceError(data.get('Error', 'Película no encontrada.'))

    return {
        'id_pelicula': data.get('imdbID'),
        'titulo': data.get('Title'),
        'anio': data.get('Year'),
        'poster': data.get('Poster'),
    }