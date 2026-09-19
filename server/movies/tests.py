from unittest.mock import patch, Mock
from django.contrib.auth.models import User
from django.core.cache import cache as django_cache
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from .services import buscar_peliculas, OMDbServiceError


class BuscarPeliculasServiceTests(TestCase):
    
    def setUp(self):
        django_cache.clear()

    @patch('movies.services.os.getenv', return_value='fake-key')
    @patch('movies.services.requests.get')
    def test_busqueda_exitosa(self, mock_get, mock_getenv):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'Response': 'True',
            'Search': [
                {
                    'imdbID': 'tt0372784',
                    'Title': 'Batman Begins',
                    'Year': '2005',
                    'Poster': 'https://poster.url',
                }
            ],
            'totalResults': '1',
        }
        mock_get.return_value = mock_response

        data = buscar_peliculas('batman')

        self.assertEqual(data['total'], 1)
        self.assertEqual(
            data['resultados'][0]['id_pelicula'],
            'tt0372784',
        )
        self.assertEqual(
            data['resultados'][0]['titulo'],
            'Batman Begins',
        )

    @patch('movies.services.os.getenv', return_value='fake-key')
    @patch('movies.services.requests.get')
    def test_sin_resultados_lanza_error_controlado(
        self,
        mock_get,
        mock_getenv,
    ):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'Response': 'False',
            'Error': 'Movie not found!',
        }
        mock_get.return_value = mock_response

        with self.assertRaises(OMDbServiceError):
            buscar_peliculas('asdkjhaskjdhaskjdh')

    @patch('movies.services.os.getenv', return_value='fake-key')
    @patch('movies.services.requests.get')
    def test_timeout_lanza_error_controlado(
        self,
        mock_get,
        mock_getenv,
    ):
        import requests

        mock_get.side_effect = requests.exceptions.Timeout()

        with self.assertRaises(OMDbServiceError):
            buscar_peliculas('batman')

    @patch('movies.services.os.getenv', return_value=None)
    def test_sin_api_key_lanza_error_controlado(self, mock_getenv):
        with self.assertRaises(OMDbServiceError):
            buscar_peliculas('batman')

    def test_query_vacio_lanza_error_controlado(self):
        with self.assertRaises(OMDbServiceError):
            buscar_peliculas('   ')


class MovieSearchViewTests(TestCase):

    def setUp(self):
        django_cache.clear()
        self.client = APIClient()

        self.user = User.objects.create_user(
            username='testuser',
            password='TestPassword123!',
        )

        self.client.force_authenticate(user=self.user)

    def test_sin_query_devuelve_400(self):
        response = self.client.get('/api/movies/search/')

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    @patch('movies.views.buscar_peliculas')
    def test_busqueda_exitosa_devuelve_200(self, mock_buscar):
        mock_buscar.return_value = {
            'resultados': [
                {
                    'id_pelicula': 'tt0372784',
                    'titulo': 'Batman Begins',
                    'anio': '2005',
                    'poster': 'https://poster.url',
                }
            ],
            'total': 1,
            'pagina': 1,
        }

        response = self.client.get(
            '/api/movies/search/?q=batman'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data['total'],
            1,
        )

    @patch('movies.views.buscar_peliculas')
    def test_api_externa_falla_devuelve_502_sin_tumbar_la_app(
        self,
        mock_buscar,
    ):
        mock_buscar.side_effect = OMDbServiceError(
            'La API externa tardó demasiado en responder.'
        )

        response = self.client.get(
            '/api/movies/search/?q=batman'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_502_BAD_GATEWAY,
        )
        self.assertIn(
            'error',
            response.data,
        )


class CacheDeBusquedasTests(TestCase):

    def setUp(self):
        django_cache.clear()

    @patch('movies.services.os.getenv', return_value='fake-key')
    @patch('movies.services.requests.get')
    def test_segunda_busqueda_no_vuelve_a_llamar_a_omdb(
        self,
        mock_get,
        mock_getenv,
    ):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'Response': 'True',
            'Search': [
                {
                    'imdbID': 'tt1',
                    'Title': 'Batman',
                    'Year': '2005',
                    'Poster': 'url',
                }
            ],
            'totalResults': '1',
        }
        mock_get.return_value = mock_response

        buscar_peliculas('batman')
        buscar_peliculas('batman')

        self.assertEqual(
            mock_get.call_count,
            1,
        )
