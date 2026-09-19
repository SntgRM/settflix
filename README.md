# Settflix

Mini-plataforma donde un usuario inicia sesión, busca películas usando la API pública de **OMDb** y arma su propia lista de favoritas. Proyecto full stack: backend en Django REST Framework + MySQL + Redis, frontend en React (Vite).

---

## Índice

- [Tecnologías usadas y por qué](#tecnologías-usadas-y-por-qué)
- [Arquitectura general](#arquitectura-general)
- [Cómo correrlo con Docker (recomendado)](#cómo-correrlo-con-docker-recomendado)
- [Cómo correrlo sin Docker (manual)](#cómo-correrlo-sin-docker-manual)
- [Variables de entorno](#variables-de-entorno)
- [Endpoints principales](#endpoints-principales)
- [Base de datos](#base-de-datos)
- [Tests](#tests)
- [Decisiones técnicas](#decisiones-técnicas)
- [Lo que quedó pendiente / mejoras futuras](#lo-que-quedó-pendiente--mejoras-futuras)

---

## Tecnologías usadas y por qué

### Backend

| Tecnología | Para qué | Por qué se eligió |
|---|---|---|
| **Django 5 + Django REST Framework** | API REST, ORM, migraciones | Framework maduro con baterías incluidas (auth, ORM, admin); DRF da serializers, permisos y vistas genéricas listas para un CRUD como el de favoritas. |
| **MySQL 8** | Base de datos relacional | Pedido explícito de la prueba; encaja bien con el modelo relacional simple (usuarios ↔ favoritas). |
| **djangorestframework-simplejwt** | Autenticación por JWT | Rutas protegidas sin manejar sesiones de servidor; el frontend guarda el token y lo manda en cada request, típico en un stack API + SPA. |
| **django-redis + Redis** | Caché de búsquedas a OMDb | Evita golpear la API externa (que tiene límite de requests) cada vez que alguien repite una búsqueda; ver detalle en Decisiones técnicas. |
| **requests** | Cliente HTTP hacia OMDb | Librería estándar de facto para llamadas HTTP en Python. |
| **django-cors-headers** | Habilitar CORS | El frontend (puerto distinto) necesita permiso explícito para llamar al backend. |
| **python-dotenv** | Cargar variables desde `.env` | Para no hardcodear credenciales ni llaves en el código. |

### Frontend

| Tecnología | Para qué | Por qué se eligió |
|---|---|---|
| **React 19 + Vite** | SPA | Vite da un dev server rápido y un build optimizado; React porque lo pide la prueba. |
| **React Router** | Navegación entre login / búsqueda / favoritas | Rutas protegidas por sesión en el cliente. |
| **Axios** | Cliente HTTP | Interceptores para adjuntar el JWT automáticamente y refrescarlo cuando expira. |
| **Tailwind CSS** | Estilos | Desarrollo rápido de UI sin escribir CSS a mano para cada componente. |
| **Context API (Auth, Favorites, Toast)** | Estado global simple | La app es pequeña; no justifica traer Redux u otra librería de estado. |

### Infraestructura

| Tecnología | Para qué | Por qué se eligió |
|---|---|---|
| **Docker + docker-compose** | Levantar todo el stack con un solo comando | Bonus pedido en la prueba; también facilita que cualquiera lo corra sin instalar MySQL/Redis/Node/Python a mano. |
| **Nginx** | Servir el build de producción del frontend | El build de Vite son archivos estáticos; Nginx es el estándar para servirlos, y maneja el fallback de rutas que necesita React Router. |

---

## Arquitectura general

```
Navegador
   │
   ▼
[Frontend React] ──(nginx, :3000)
   │  llama solo a TU backend, nunca a OMDb directamente
   ▼
[Backend Django] ──(:8000)
   │                     │
   ▼                     ▼
[MySQL] (:3306)     [Redis] (:6379, caché de búsquedas)
                          │
                          ▼
                    [OMDb API] (externa)
```

El frontend nunca habla directo con OMDb: todas las búsquedas pasan por `GET /api/movies/search/` en el backend, que consulta OMDb, cachea el resultado en Redis y responde con un formato propio (`id_pelicula`, `titulo`, `anio`, `poster`).

---

## Cómo correrlo con Docker (recomendado)

Requisitos: tener [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado (incluye `docker compose`).

### 1. Clona el repo y entra a la carpeta

```bash
git clone https://github.com/SntgRM/settflix
cd settflix
```

### 2. Crea tu archivo de variables de entorno

```bash
cp .env.example .env
```

Abre `.env` y completa como mínimo:

- `OMDB_API_KEY`: consíguela gratis en https://www.omdbapi.com/apikey.aspx
- `SECRET_KEY`: cualquier cadena larga y aleatoria (o deja la del ejemplo si es solo para probar local)
- `DB_PASSWORD` / `DB_ROOT_PASSWORD`: las que quieras, solo se usan dentro de los contenedores

`.env` está en `.gitignore` y nunca se sube al repositorio — así se cumple el requisito de no dejar llaves ni contraseñas en el código.

### 3. Levanta todo

```bash
docker compose up --build
```

Esto construye las imágenes y levanta 4 contenedores:

| Servicio | Puerto en tu máquina | Qué es |
|---|---|---|
| `frontend` | http://localhost:3000 | React compilado, servido por Nginx |
| `backend` | http://localhost:8000 | API Django |
| `db` | localhost:3306 | MySQL |
| `redis` | localhost:6379 | Caché |

El backend espera automáticamente a que MySQL esté listo, corre las migraciones, y (si definiste `DJANGO_SEED_USERS` en tu `.env`) crea usuarios de prueba antes de arrancar.

### 4. Entra a la app

Abre **http://localhost:3000**, inicia sesión con un usuario de prueba (o créalo tú mismo, ver abajo), busca una película y agrégala a favoritas.

### Crear un usuario manualmente

Si prefieres no usar `DJANGO_SEED_USERS`, crea uno a mano una vez que el stack esté arriba:

```bash
docker compose exec backend python manage.py createsuperuser
```

o, para un usuario normal sin acceso al admin:

```bash
docker compose exec backend python manage.py shell -c \
  "from django.contrib.auth.models import User; User.objects.create_user('pepe', password='pepe12345')"
```

### Ver la base de datos

```bash
docker compose exec db mysql -u root -p
```
(contraseña: la que pusiste en `DB_ROOT_PASSWORD`)

```sql
USE settflix_db;
SHOW TABLES;
SELECT * FROM auth_user;
SELECT * FROM favoritas;
```

También puedes conectarte desde un cliente gráfico (DBeaver, TablePlus, MySQL Workbench) a `localhost:3306` con esas mismas credenciales.

### Apagar todo

```bash
docker compose down
```

Agrega `-v` si además quieres borrar los datos de MySQL (`docker compose down -v`).

---

## Cómo correrlo sin Docker (manual)

Requiere tener MySQL corriendo localmente (Redis es opcional: si no lo tienes, el backend usa caché en memoria automáticamente).

### Backend

```bash
cd server
python -m venv venv
source venv/bin/activate  # en Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # y ajusta DB_HOST=127.0.0.1, etc.
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd client
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev
```

Abre http://localhost:5173.

---

## Variables de entorno

Ver `.env.example` para la lista completa y comentada. Las más importantes:

| Variable | Para qué |
|---|---|
| `SECRET_KEY` | Clave secreta de Django |
| `DEBUG` | `True` en local/Docker de prueba, `False` en producción real |
| `ALLOWED_HOSTS` | Hosts permitidos (separados por coma) |
| `CORS_ALLOWED_ORIGINS` | Orígenes del frontend permitidos por CORS |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_ROOT_PASSWORD` | Credenciales de MySQL |
| `REDIS_URL` | Si está definida, el backend usa Redis como caché; si no, usa memoria local |
| `OMDB_API_KEY` / `OMDB_BASE_URL` / `OMDB_CACHE_TTL` | Configuración de la integración con OMDb |
| `DJANGO_SEED_USERS` | Usuarios de prueba a crear automáticamente (`usuario:password,usuario:password`) |
| `VITE_API_URL` | URL del backend que usa el frontend (se "hornea" en el build) |

---

## Endpoints principales

Todos bajo `/api/`, todos (salvo login) requieren header `Authorization: Bearer <access_token>`.

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/auth/login/` | Login, devuelve `access` y `refresh` |
| POST | `/api/auth/token/refresh/` | Renueva el `access` token |
| POST | `/api/auth/logout/` | Invalida el `refresh` token (blacklist) |
| GET | `/api/movies/search/?q=&page=` | Busca películas en OMDb (con caché) |
| GET | `/api/favorites/` | Lista las favoritas del usuario autenticado (soporta `?anio=`, `?nota_min=`, `?nota_max=`, `?ordering=`) |
| POST | `/api/favorites/` | Agrega una película a favoritas |
| PATCH | `/api/favorites/<id>/` | Actualiza la nota de una favorita |
| DELETE | `/api/favorites/<id>/` | Elimina una favorita |

---

## Base de datos

Dos tablas principales, relacionadas por clave foránea:

- **`auth_user`** (la tabla de usuarios estándar de Django: username, password hasheado, etc.)
- **`favoritas`**: `id`, `usuario_id` (FK a `auth_user`), `id_pelicula` (imdbID de OMDb), `titulo`, `anio`, `poster`, `nota` (1-5, opcional), `fecha_agregado`.
  - Constraint único de `(usuario, id_pelicula)`: un usuario no puede agregar la misma película dos veces.
  - Check constraint: `nota` solo puede ser `NULL` o estar entre 1 y 5.

---

## Tests

```bash
# con Docker:
docker compose exec backend python manage.py test

# sin Docker:
cd server && python manage.py test
```

Cubren:
- El servicio de integración con OMDb (`movies/services.py`), **mockeando** la API externa: búsqueda exitosa, sin resultados, timeout, sin API key, query vacío.
- Que la caché evita una segunda llamada real a OMDb para la misma búsqueda.
- El endpoint de búsqueda (`/api/movies/search/`): validación de parámetros y manejo de errores de la API externa sin tumbar la app (devuelve 502 controlado).
- El CRUD de favoritas: creación, duplicados, aislamiento entre usuarios (un usuario no puede ver/editar/borrar favoritas de otro), filtros por año/nota y ordenamiento.

---

## Decisiones técnicas

- **Caché con Redis en vez de Memcached u otra opción**: `django-redis` se integra directamente con el `cache` framework de Django, así que el código en `movies/services.py` no sabe ni le importa si el backend de caché es memoria local o Redis — solo llama a `cache.get`/`cache.set`. Eso permitió activar Redis solo en Docker (vía la variable `REDIS_URL`) sin tocar una sola línea de lógica de negocio ni romper el flujo de desarrollo local sin Redis instalado.
- **JWT en vez de sesiones de Django**: al ser una API consumida por una SPA separada (no templates de Django), JWT evita tener que lidiar con cookies de sesión y CSRF entre dos orígenes distintos.
- **El frontend nunca llama a OMDb directamente**: todo pasa por el backend, que es quien guarda la API key (nunca expuesta al navegador) y quien decide qué formato devolver, según pide la prueba.
- **`runserver` en vez de Gunicorn dentro de Docker**: como el proyecto no se va a desplegar (solo se dockerizó como entrega de la prueba), se priorizó simplicidad: `runserver` no necesita configurar `collectstatic` ni `whitenoise` para servir los estáticos del admin/DRF, y cumple perfectamente el objetivo de "`docker compose up` y queda corriendo". En un despliegue real se cambiaría por Gunicorn/uWSGI detrás de un proxy.
- **Nginx sirviendo el build de Vite**: en vez de dejar corriendo el servidor de desarrollo de Vite dentro del contenedor (pensado para hot-reload, no para "dejarlo corriendo"), se compila el frontend a estático y se sirve con Nginx, que es el estándar para ese caso y ya incluye el fallback de rutas que necesita React Router (`try_files ... /index.html`).
- **`VITE_API_URL` como build-arg, no como variable de entorno de runtime**: Vite incrusta las variables `VITE_*` dentro del bundle de JavaScript en tiempo de build, no las lee en tiempo de ejecución. Por eso se pasa como `ARG` de Docker en vez de como variable de entorno del contenedor final.
- **Constraint único `(usuario, id_pelicula)` a nivel de base de datos**: en vez de validarlo solo en el serializer, se agregó también como constraint de MySQL, para que la integridad no dependa únicamente de la capa de aplicación.

---

## Lo que quedó pendiente / mejoras futuras

- No hay paginación real "infinita" en el frontend más allá de lo que ya expone `page` en `/api/movies/search/`.
- No se agregó rate limiting propio sobre el endpoint de búsqueda (solo se depende del límite de la API de OMDb, capturado como error controlado).
- No se implementó recuperación de contraseña ni registro de usuarios nuevos desde el frontend (los usuarios se crean por consola, vía `createsuperuser` o `DJANGO_SEED_USERS`), porque no era un requisito funcional mínimo de la prueba.
- Para un entorno real de producción faltaría: servidor WSGI de producción (Gunicorn) detrás de un proxy con HTTPS, `collectstatic` + almacenamiento de estáticos aparte, backups automáticos de MySQL, y separar los volúmenes/`.env` por ambiente (dev/staging/prod).
