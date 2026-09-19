# Settflix

Mini-plataforma de películas desarrollada como prueba técnica Full Stack.

Permite autenticarse, buscar películas mediante OMDb, agregarlas a favoritos, calificarlas, filtrarlas y ordenarlas.

## Stack

### Frontend
- React 19
- Vite
- Tailwind CSS 4
- Axios
- React Router
- JavaScript / JSX

### Backend
- Python
- Django 5.2
- Django REST Framework
- SimpleJWT
- MySQL 8
- Redis

### Infraestructura
- Docker
- Docker Compose
- Nginx

## Estructura

```text
settflix/
├── client/              # Frontend React
├── server/              # Backend Django
├── .env.example         # Variables de entorno de ejemplo
├── docker-compose.yml
├── schema.sql           # Estructura de la base de datos
└── README.md
```

## Requisitos

Para ejecutar el proyecto con Docker únicamente se necesita:

- Git
- Docker Desktop

No es necesario instalar manualmente Python, Node.js, MySQL o Redis.

## Configuración

Clonar el repositorio:

```bash
git clone https://github.com/SntgRM/settflix.git
cd settflix
```

Crear el archivo `.env` a partir de la plantilla:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**Linux/macOS**
```bash
cp .env.example .env
```

Configurar la API Key de OMDb en `.env`:

```env
OMDB_API_KEY=your_omdb_api_key
```

El resto de variables necesarias están documentadas en `.env.example`.

### Variables principales

```dotenv
SECRET_KEY=change-this-secret-key
DEBUG=True

DB_NAME=settflix_db
DB_USER=settflix_user
DB_PASSWORD=change-this-db-password
DB_ROOT_PASSWORD=change-this-root-password
DB_HOST=db
DB_PORT=3306

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ALLOWED_HOSTS=localhost,127.0.0.1,backend

OMDB_BASE_URL=https://www.omdbapi.com/
OMDB_API_KEY=your-omdb-api-key
OMDB_CACHE_TTL=900

REDIS_URL=redis://redis:6379/1

DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=change-this-password
DJANGO_SUPERUSER_EMAIL=admin@example.com

VITE_API_URL=http://localhost:8000/api
```

> **Nota:** `DB_HOST` y `REDIS_URL` usan los nombres de los servicios definidos en `docker-compose.yml` (`db` y `redis`), no `127.0.0.1` ni `localhost`, ya que los contenedores se comunican entre sí a través de la red interna de Docker.
>
> El `.env` real no se incluye en el repositorio porque contiene credenciales y claves privadas. `.env.example` sirve únicamente como plantilla — reemplaza `SECRET_KEY`, las contraseñas de la base de datos, `DJANGO_SUPERUSER_PASSWORD` y `OMDB_API_KEY` por valores propios antes de usar en producción. En producción, además, `DEBUG` debe establecerse en `False`.

## Docker

Levantar todo el proyecto:

```bash
docker compose up --build
```

**Frontend:** [http://localhost:3000](http://localhost:3000)

**Backend:** [http://localhost:8000](http://localhost:8000)

Docker se encarga de levantar:

- Frontend
- Backend
- MySQL
- Redis

No es necesario crear manualmente una base de datos o un usuario de MySQL para ejecutar el proyecto mediante Docker. Los valores de `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `DB_ROOT_PASSWORD` se utilizan para configurar el contenedor de MySQL.

MySQL Workbench es opcional y únicamente sirve como cliente para inspeccionar la base de datos.

## Base de datos

Django utiliza migraciones para crear las tablas necesarias.

La base de datos incluye las tablas propias de Django, autenticación/JWT y la tabla de películas favoritas.

El archivo `schema.sql` contiene la estructura de la base de datos sin los registros actuales.

Puede generarse nuevamente con:

```bash
docker compose exec db mysqldump -u root -p --no-data --routines=false --triggers=false settflix_db > schema.sql
```

## Redis y OMDb

Redis se utiliza para almacenar temporalmente las búsquedas de OMDb.

```env
OMDB_CACHE_TTL=900
```

Esto representa 15 minutos de caché.

El backend es responsable de comunicarse con OMDb; el frontend no consume directamente la API externa.

## entrypoint.sh en Windows

El backend utiliza `entrypoint.sh` durante el inicio del contenedor.

Si el proyecto se modifica o clona desde Windows, es importante verificar que este archivo utilice finales de línea **LF** y no **CRLF**.

Un archivo `entrypoint.sh` en formato CRLF puede provocar errores como:

```
no such file or directory
```

aunque el archivo exista.

En VS Code:

```
CRLF → LF
```

Después de realizar el cambio, reconstruir las imágenes:

```bash
docker compose down -v
docker compose build --no-cache
docker compose up
```

> El flag `-v` elimina los volúmenes, incluyendo los datos persistidos de MySQL, por lo que solamente debe utilizarse cuando se quiera iniciar con una base de datos limpia.

## Seguridad

No subir nunca el archivo:

```
.env
```

al repositorio.

Las credenciales, API keys y `SECRET_KEY` reales deben permanecer fuera de Git.

El repositorio incluye únicamente `.env.example` con valores de ejemplo.

## Ejecución desde cero

Para comprobar que el proyecto puede ejecutarse en un entorno limpio:

```bash
git clone https://github.com/SntgRM/settflix.git
cd settflix
```

Crear `.env`, configurar `OMDB_API_KEY` y ejecutar:

```bash
docker compose build --no-cache
docker compose up
```
