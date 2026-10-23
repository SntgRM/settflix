import json
import sys
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

import envfile  # noqa: E402

envfile.load()

from src.common import db, omdb, security  # noqa: E402
from src.handlers import auth, favorites, health, movies  # noqa: E402

USER, PASS = "__test_user__", "ClaveSegura123"
PELICULAS = {
    "tt0111161": {"id_pelicula": "tt0111161", "titulo": "The Shawshank Redemption", "anio": "1994", "poster": "https://x/p.jpg"},
    "tt0068646": {"id_pelicula": "tt0068646", "titulo": "The Godfather", "anio": "1972", "poster": "N/A"},
}


def call(handler, method="GET", path_params=None, query=None, body=None, token=None):
    """Arma un evento v2 de API Gateway y devuelve (status, json)."""
    event = {
        "requestContext": {"http": {"method": method}},
        "headers": {"authorization": f"Bearer {token}"} if token else {},
        "queryStringParameters": query,
        "pathParameters": path_params,
        "body": json.dumps(body) if body is not None else None,
    }
    res = handler(event, None)
    return res["statusCode"], (json.loads(res["body"]) if res.get("body") else None)


def fake_detail(id_pelicula):
    if id_pelicula not in PELICULAS:
        raise omdb.OMDbNotFoundError("Incorrect IMDb ID.")
    return PELICULAS[id_pelicula]


def _borrar_usuario_de_prueba():
    # Primero las favoritas: la BD que creó Django no tiene ON DELETE CASCADE.
    db.execute("DELETE FROM favoritas WHERE usuario_id IN (SELECT id FROM auth_user WHERE username = %s)", (USER,))
    db.execute("DELETE FROM auth_user WHERE username = %s", (USER,))


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _borrar_usuario_de_prueba()
        db.execute(
            "INSERT INTO auth_user (password, is_superuser, username, first_name, last_name, email, "
            "is_staff, is_active, date_joined) VALUES (%s,0,%s,'','','t@t.com',0,1,UTC_TIMESTAMP(6))",
            (security.make_password(PASS, iterations=1000), USER),  # pocas iteraciones: tests rápidos
        )

    @classmethod
    def tearDownClass(cls):
        _borrar_usuario_de_prueba()

    def setUp(self):
        status, data = call(auth.login, "POST", body={"username": USER, "password": PASS})
        self.assertEqual(status, 200)
        self.tokens = data
        self.token = data["access"]
        db.execute("DELETE FROM favoritas WHERE usuario_id = %s", (data["user"]["id"],))

    # ── salud ──
    def test_health(self):
        self.assertEqual(call(health.handler), (200, {"status": "ok"}))

    # ── auth ──
    def test_login_errores(self):
        self.assertEqual(call(auth.login, "POST", body={})[0], 400)
        self.assertEqual(call(auth.login, "POST", body={"username": USER, "password": "mala"})[0], 401)
        self.assertEqual(call(auth.login, "POST", body={"username": "no_existe", "password": "x"})[0], 401)

    def test_login_ok_forma_de_respuesta(self):
        self.assertEqual(set(self.tokens), {"access", "refresh", "user"})
        self.assertEqual(self.tokens["user"]["username"], USER)

    def test_rutas_protegidas_exigen_token(self):
        self.assertEqual(call(favorites.collection)[0], 401)
        self.assertEqual(call(movies.search, query={"q": "x"})[0], 401)
        self.assertEqual(call(favorites.collection, token="basura")[0], 401)
        # un refresh token NO sirve como access token
        self.assertEqual(call(favorites.collection, token=self.tokens["refresh"])[0], 401)

    def test_refresh_rota_y_bloquea_reutilizacion(self):
        old = self.tokens["refresh"]
        status, data = call(auth.refresh, "POST", body={"refresh": old})
        self.assertEqual(status, 200)
        self.assertEqual(set(data), {"access", "refresh"})
        self.assertNotEqual(data["refresh"], old)
        self.assertEqual(call(auth.refresh, "POST", body={"refresh": old})[0], 401)  # ya usado
        self.assertEqual(call(auth.refresh, "POST", body={"refresh": self.token})[0], 401)  # tipo incorrecto
        self.assertEqual(call(auth.refresh, "POST", body={})[0], 400)

    def test_logout(self):
        self.assertEqual(call(auth.logout, "POST", body={"refresh": self.tokens["refresh"]})[0], 401)  # sin access
        status, _ = call(auth.logout, "POST", token=self.token, body={"refresh": self.tokens["refresh"]})
        self.assertEqual(status, 200)
        # el refresh cerrado ya no sirve
        self.assertEqual(call(auth.refresh, "POST", body={"refresh": self.tokens["refresh"]})[0], 401)
        self.assertEqual(call(auth.logout, "POST", token=self.token, body={})[0], 400)

    # ── movies ──
    def test_search_validaciones_y_ok(self):
        self.assertEqual(call(movies.search, token=self.token)[0], 400)
        self.assertEqual(call(movies.search, token=self.token, query={"q": "a", "page": "x"})[0], 400)
        self.assertEqual(call(movies.search, token=self.token, query={"q": "a", "page": "101"})[0], 400)
        fake = {"resultados": [{"id_pelicula": "tt1"}], "total": 1, "pagina": 1}
        with mock.patch.object(omdb, "buscar_peliculas", return_value=fake):
            self.assertEqual(call(movies.search, token=self.token, query={"q": "matrix"}), (200, fake))
        with mock.patch.object(omdb, "buscar_peliculas", side_effect=omdb.OMDbServiceError("caído")):
            self.assertEqual(call(movies.search, token=self.token, query={"q": "matrix"}), (502, {"error": "caído"}))

    def test_omdb_usa_cache(self):
        payload = {"Response": "True", "Search": [{"imdbID": "tt1", "Title": "T", "Year": "2000", "Poster": "P"}], "totalResults": "1"}
        with mock.patch.object(omdb, "_request", return_value=payload) as req:
            a = omdb.buscar_peliculas("  CacheTest-Unico  ", 1)
            b = omdb.buscar_peliculas("cachetest-unico", 1)  # misma consulta normalizada
        self.assertEqual(a, b)
        self.assertEqual(req.call_count, 1)  # la 2.ª salió de la caché

    # ── favorites ──
    def test_favoritas_crud_completo(self):
        with mock.patch.object(omdb, "obtener_pelicula_por_id", side_effect=fake_detail):
            # crear
            status, fav = call(favorites.collection, "POST", token=self.token, body={"id_pelicula": "tt0111161", "nota": 5})
            self.assertEqual(status, 201)
            self.assertEqual((fav["titulo"], fav["anio"], fav["nota"]), ("The Shawshank Redemption", "1994", 5))
            self.assertTrue(fav["fecha_agregado"].endswith("Z"))
            # duplicado
            self.assertEqual(call(favorites.collection, "POST", token=self.token, body={"id_pelicula": "tt0111161"})[0], 409)
            # no existe en OMDb
            self.assertEqual(call(favorites.collection, "POST", token=self.token, body={"id_pelicula": "tt9999999"})[0], 404)
            # segunda
            self.assertEqual(call(favorites.collection, "POST", token=self.token, body={"id_pelicula": "tt0068646", "nota": 3})[0], 201)

        # listar + filtros + orden
        _, todas = call(favorites.collection, token=self.token)
        self.assertEqual([f["id_pelicula"] for f in todas], ["tt0068646", "tt0111161"])  # más nueva primero
        _, por_nota = call(favorites.collection, token=self.token, query={"ordering": "-nota"})
        self.assertEqual([f["nota"] for f in por_nota], [5, 3])
        _, filtradas = call(favorites.collection, token=self.token, query={"nota_min": "4"})
        self.assertEqual(len(filtradas), 1)
        _, por_anio = call(favorites.collection, token=self.token, query={"anio": "1972"})
        self.assertEqual(por_anio[0]["id_pelicula"], "tt0068646")
        _, invalido = call(favorites.collection, token=self.token, query={"nota_min": "abc", "ordering": "x; DROP TABLE"})
        self.assertEqual(len(invalido), 2)  # filtro inválido ignorado, orden por defecto

        # detalle / editar / borrar
        fid = fav["id"]
        self.assertEqual(call(favorites.detail, path_params={"id": str(fid)}, token=self.token)[1]["id"], fid)
        self.assertEqual(call(favorites.detail, "PATCH", {"id": str(fid)}, body={"nota": 2}, token=self.token), (200, {"id": fid, "nota": 2}))
        self.assertEqual(call(favorites.detail, "PATCH", {"id": str(fid)}, body={"nota": 9}, token=self.token)[0], 400)
        self.assertEqual(call(favorites.detail, "PATCH", {"id": str(fid)}, body={"nota": None}, token=self.token), (200, {"id": fid, "nota": None}))
        self.assertEqual(call(favorites.detail, "DELETE", {"id": str(fid)}, token=self.token), (204, None))
        self.assertEqual(call(favorites.detail, path_params={"id": str(fid)}, token=self.token)[0], 404)
        self.assertEqual(call(favorites.detail, path_params={"id": "abc"}, token=self.token)[0], 404)

    def test_validaciones_al_crear(self):
        for body in ({}, {"id_pelicula": ""}, {"id_pelicula": "x" * 21}, {"id_pelicula": "tt1", "nota": 6}, {"id_pelicula": "tt1", "nota": "a"}):
            status, errors = call(favorites.collection, "POST", token=self.token, body=body)
            self.assertEqual(status, 400, body)
            self.assertIn(next(iter(errors)), ("id_pelicula", "nota"))

    def test_un_usuario_no_ve_las_favoritas_de_otro(self):
        with mock.patch.object(omdb, "obtener_pelicula_por_id", side_effect=fake_detail):
            _, fav = call(favorites.collection, "POST", token=self.token, body={"id_pelicula": "tt0111161"})
        ajeno = security.issue_access(user_id=999999)
        self.assertEqual(call(favorites.collection, token=ajeno), (200, []))
        self.assertEqual(call(favorites.detail, "DELETE", {"id": str(fav["id"])}, token=ajeno)[0], 404)


class SecurityTests(unittest.TestCase):
    def test_hash_formato_django(self):
        h = security.make_password("abc12345", iterations=1000)
        self.assertTrue(h.startswith("pbkdf2_sha256$1000$"))
        self.assertTrue(security.check_password("abc12345", h))
        self.assertFalse(security.check_password("otra", h))
        self.assertFalse(security.check_password("x", "formato-raro"))


if __name__ == "__main__":
    unittest.main()
