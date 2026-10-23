# Settflix

Mini-plataforma de películas (prueba técnica Full Stack).

Permite autenticarse, buscar películas en OMDb, guardarlas como favoritas, calificarlas, filtrarlas y ordenarlas.

Esta versión del repo usa un **backend serverless** (Serverless Framework + Python) en lugar de Django. El frontend React se mantiene. En local, la API se emula con `serverless-offline` y MySQL corre en Docker; no hay Redis ni Nginx.

El detalle interno del backend (handlers, JWT, caché, SQL) está en [`server/GUIA_RAPIDA.md`](server/GUIA_RAPIDA.md).

## Ramas

Hay **dos backends** en el mismo repositorio, cada uno en su rama:

| Rama | Qué es |
|---|---|
| `master` | Versión original: Django + DRF + Redis + Docker Compose (frontend, backend, MySQL, Redis, Nginx). |
| `serverless` | Esta versión: Python + Serverless Framework, MySQL en Docker, API local con `serverless-offline`. |

El nombre `serverless` encaja bien: es corto, dice el cambio de arquitectura y no se confunde con `master`.

Este README documenta **`serverless`**. Si estás en `master`, las instrucciones de abajo (venv, `serverless offline`, `server/.env`) no aplican.

### Cómo cambiar de rama

Si el repo **ya está clonado**:

```bash
git fetch origin
git switch serverless
```

(`git checkout serverless` hace lo mismo en Git más viejo.)

Si la rama aún no existe en tu máquina pero sí en GitHub:

```bash
git fetch origin
git switch -c serverless --track origin/serverless
```

Para volver a Django:

```bash
git switch master
```

Git no deja cambiar de rama si tienes cambios sin guardar. O los commiteas en la rama actual, o los apartas:

```bash
git stash push -u -m "wip"
git switch serverless
```

### Clonar directo en esta versión

```bash
git clone -b serverless https://github.com/SntgRM/settflix.git
cd settflix
```

## Qué puedes hacer

- Iniciar sesión (JWT access + refresh; el refresh rota y se invalida al reusar o al cerrar sesión).
- Buscar películas por texto, con paginación, a través del backend (el cliente **no** llama a OMDb).
- Agregar / quitar favoritas, poner nota 1–5, filtrar y ordenar la lista.
- Las favoritas son por usuario: nadie ve ni edita las de otro.

No hay registro público. Los usuarios se crean con un script.

## Stack

### Frontend (`client/`)

- React 19
- Vite
- Tailwind CSS 4
- Axios
- React Router 7
- JavaScript / JSX

### Backend (`server/`)

- Python 3.13
- [Serverless Framework](https://www.serverless.com/) 4 (AWS Lambda + HTTP API)
- `serverless-offline` (API local en el puerto 8000)
- PyMySQL + MySQL 8
- PyJWT (access 1 h, refresh 7 días, mismos claims que SimpleJWT)
- OMDb (`urllib`, sin `requests`)
- Caché de OMDb en memoria + tabla MySQL (sin Redis)

### Infraestructura local

- Docker / Docker Compose **solo para MySQL**
- El frontend y la API corren en el host (Node + Python)

## Estructura

```text
settflix-serverless-framework/
├── client/                 # Frontend React + Vite
├── server/                 # Backend serverless
│   ├── serverless.yml      # Rutas, CORS, env, 7 funciones Lambda
│   ├── src/handlers/       # Endpoints (auth, movies, favorites, health)
│   ├── src/common/         # Request/JWT/MySQL/OMDb/caché
│   ├── db/schema.sql       # Tablas (se carga al crear el volumen de MySQL)
│   ├── scripts/            # create_user.py, envfile.py
│   ├── tests/              # Pruebas de integración
│   └── docker-compose.yml  # MySQL 8
├── .env.example            # Plantilla de variables
└── README.md
```

## Requisitos

- Git
- Docker Desktop (MySQL)
- Node.js (Vite + Serverless CLI / offline)
- Python 3.13
- Una [API key de OMDb](https://www.omdbapi.com/apikey.aspx)

## Configuración

```bash
git clone -b serverless https://github.com/SntgRM/settflix.git
cd settflix
```

Si ya clonaste sin `-b`, entra al directorio y `git switch serverless` (hace falta que la rama exista en `origin`).

Copia la plantilla **al backend** (Compose y `serverless.yml` leen `server/.env`):

**Windows PowerShell**

```powershell
Copy-Item .env.example server\.env
```

**Linux / macOS**

```bash
cp .env.example server/.env
```

El frontend lee `VITE_API_URL` desde `client/.env`:

**Windows PowerShell**

```powershell
"VITE_API_URL=http://localhost:8000/api" | Set-Content client\.env
```

**Linux / macOS**

```bash
echo "VITE_API_URL=http://localhost:8000/api" > client/.env
```

En `server/.env` pon al menos:

```env
SECRET_KEY=una-clave-larga-y-aleatoria
DB_PASSWORD=...
DB_ROOT_PASSWORD=...
OMDB_API_KEY=tu_omdb_api_key
```

`SECRET_KEY` firma los JWT. Si falta, el backend no arranca.

El `.env` no va a Git. `.env.example` es solo la plantilla.

### Variables que usa esta versión

```dotenv
SECRET_KEY=
DB_NAME=settflix_db
DB_USER=settflix_user
DB_PASSWORD=
DB_ROOT_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306
OMDB_BASE_URL=https://www.omdbapi.com/
OMDB_API_KEY=
OMDB_CACHE_TTL=900
```

`DB_HOST=127.0.0.1` porque `serverless offline` corre **en tu máquina** y entra a MySQL por el puerto publicado. No uses el hostname `db` (ese nombre solo existiría entre contenedores).

CORS está en `server/serverless.yml` (`httpApi.cors`), no en el `.env`. Orígenes permitidos: `localhost` / `127.0.0.1` en puertos **3000** y **5173**.

## Cómo ponerlo a correr

Tres procesos: MySQL, API, frontend.

### 1. MySQL

```bash
cd server
docker compose up -d --wait
```

Compose crea la base, el usuario y ejecuta `db/schema.sql` la primera vez que existe el volumen.

Tablas: `auth_user`, `favoritas`, `jwt_blacklist`, `omdb_cache`.

### 2. Backend (API en :8000)

```bash
cd server
python -m venv .venv
```

**Windows PowerShell:** `.\.venv\Scripts\Activate.ps1`  
**Linux / macOS:** `source .venv/bin/activate`

```bash
pip install -r requirements.txt
npm install
npx serverless offline
```

Comprueba: [http://localhost:8000/api/health/](http://localhost:8000/api/health/) → `{"status":"ok"}`.

Crea un usuario (venv activo, MySQL arriba):

```bash
python scripts/create_user.py admin admin123 --email admin@example.com --superuser
```

Si el username ya existe, actualiza contraseña y email.

### 3. Frontend (Vite, :5173 por defecto)

En otra terminal:

```bash
cd client
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) e inicia sesión con el usuario del script.

Scripts npm del backend (`server/package.json`): `npm run db:up`, `db:down`, `offline`, `test`.

## API (contrato del frontend)

Base: `http://localhost:8000/api`

| Método | Ruta | Auth |
|---|---|---|
| GET | `/health/` | no |
| POST | `/auth/login/` | no |
| POST | `/auth/token/refresh/` | refresh en el body |
| POST | `/auth/logout/` | Bearer access + refresh en el body |
| GET | `/movies/search/?q=&page=` | Bearer access |
| GET, POST | `/favorites/` | Bearer access |
| GET, PUT, PATCH, DELETE | `/favorites/{id}/` | Bearer access |

Las rutas llevan `/` final.

## Caché de OMDb

Sin Redis. TTL por defecto 15 minutos (`OMDB_CACHE_TTL=900`):

1. Memoria del proceso (rápida; se pierde si el proceso se reinicia).
2. Tabla `omdb_cache` (compartida y persistente).

Solo el backend habla con OMDb.

## Pruebas

MySQL arriba, venv activo, `server/.env` cargado:

```bash
cd server
python -m unittest discover -s tests -v
```

Invocan los handlers con eventos falsos de API Gateway contra la BD real. OMDb está mockeado (no gasta cuota). Crean y borran el usuario `__test_user__`.

## Seguridad

- No subas `.env`, `server/.env` ni `client/.env`.
- No imprimas `OMDB_API_KEY` (viaja en la query hacia OMDb).
- En AWS real los secretos irían en el proveedor de secretos / parámetros, no en un archivo local.

Esta copia está pensada para **desarrollo local**. Un deploy real a Lambda + API Gateway implica red, IAM y cómo llega Lambda a MySQL; no forma parte de este flujo de arranque.

## Ejecución desde cero (checklist)

1. Clonar el repo.
2. Copiar `.env.example` → `server/.env` y rellenar `SECRET_KEY`, contraseñas y `OMDB_API_KEY`.
3. Crear `client/.env` con `VITE_API_URL=http://localhost:8000/api`.
4. `cd server && docker compose up -d --wait`
5. Crear venv, `pip install -r requirements.txt`, `npm install`, `npx serverless offline`
6. `python scripts/create_user.py ...`
7. `cd client && npm install && npm run dev`
8. Entrar a [http://localhost:5173](http://localhost:5173)
