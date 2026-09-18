from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Favorita


def get_access_token(user):
    return str(RefreshToken.for_user(user).access_token)


class FavoritaListCreateViewTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='ana', password='clave12345')
        self.token = get_access_token(self.user)

    def auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_sin_token_devuelve_401(self):
        response = self.client.get('/api/favorites/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_agregar_favorita_exitoso(self):
        self.auth()
        payload = {
            'id_pelicula': 'tt0372784',
            'titulo': 'Batman Begins',
            'anio': '2005',
            'poster': 'https://poster.url',
            'nota': 9,
        }
        response = self.client.post('/api/favorites/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Favorita.objects.count(), 1)
        self.assertEqual(Favorita.objects.first().usuario, self.user)

    def test_agregar_favorita_sin_id_pelicula_devuelve_400(self):
        self.auth()
        payload = {'titulo': 'Batman Begins', 'anio': '2005'}
        response = self.client.post('/api/favorites/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_agregar_favorita_con_nota_invalida_devuelve_400(self):
        self.auth()
        payload = {
            'id_pelicula': 'tt0372784',
            'titulo': 'Batman Begins',
            'anio': '2005',
            'nota': 15,
        }
        response = self.client.post('/api/favorites/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_agregar_pelicula_duplicada_devuelve_409(self):
        self.auth()
        Favorita.objects.create(
            usuario=self.user,
            id_pelicula='tt0372784',
            titulo='Batman Begins',
            anio='2005',
        )
        payload = {
            'id_pelicula': 'tt0372784',
            'titulo': 'Batman Begins',
            'anio': '2005',
        }
        response = self.client.post('/api/favorites/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_listar_solo_devuelve_favoritas_propias(self):
        otro_usuario = User.objects.create_user(username='luis', password='clave12345')

        Favorita.objects.create(
            usuario=self.user, id_pelicula='tt1', titulo='Película de Ana', anio='2020'
        )
        Favorita.objects.create(
            usuario=otro_usuario, id_pelicula='tt2', titulo='Película de Luis', anio='2021'
        )

        self.auth()
        response = self.client.get('/api/favorites/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['titulo'], 'Película de Ana')


class FavoritaDetailViewTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='ana', password='clave12345')
        self.otro_usuario = User.objects.create_user(username='luis', password='clave12345')
        self.token = get_access_token(self.user)

        self.favorita_de_ana = Favorita.objects.create(
            usuario=self.user, id_pelicula='tt1', titulo='Película de Ana', anio='2020', nota=8
        )
        self.favorita_de_luis = Favorita.objects.create(
            usuario=self.otro_usuario, id_pelicula='tt2', titulo='Película de Luis', anio='2021'
        )

    def auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_actualizar_nota_propia(self):
        self.auth()
        response = self.client.patch(
            f'/api/favorites/{self.favorita_de_ana.id}/',
            {'nota': 10},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.favorita_de_ana.refresh_from_db()
        self.assertEqual(self.favorita_de_ana.nota, 10)

    def test_no_puede_ver_favorita_de_otro_usuario(self):
        self.auth()
        response = self.client.get(f'/api/favorites/{self.favorita_de_luis.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_no_puede_editar_favorita_de_otro_usuario(self):
        self.auth()
        response = self.client.patch(
            f'/api/favorites/{self.favorita_de_luis.id}/',
            {'nota': 1},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.favorita_de_luis.refresh_from_db()
        self.assertIsNone(self.favorita_de_luis.nota)

    def test_no_puede_eliminar_favorita_de_otro_usuario(self):
        self.auth()
        response = self.client.delete(f'/api/favorites/{self.favorita_de_luis.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Favorita.objects.filter(id=self.favorita_de_luis.id).exists())

    def test_eliminar_favorita_propia(self):
        self.auth()
        response = self.client.delete(f'/api/favorites/{self.favorita_de_ana.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Favorita.objects.filter(id=self.favorita_de_ana.id).exists())