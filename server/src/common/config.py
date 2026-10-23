import os

SECRET_KEY = os.environ["SECRET_KEY"]

DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")
DB_PORT = int(os.environ.get("DB_PORT", "3306"))
DB_NAME = os.environ.get("DB_NAME", "settflix_db")
DB_USER = os.environ.get("DB_USER", "settflix_user")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")

OMDB_BASE_URL = os.environ.get("OMDB_BASE_URL") or "https://www.omdbapi.com/"
OMDB_CACHE_TTL = int(os.environ.get("OMDB_CACHE_TTL") or 900)
OMDB_TIMEOUT = 5  # segundos


def omdb_api_key():
    return os.environ.get("OMDB_API_KEY", "")


ACCESS_TOKEN_LIFETIME = 60 * 60 # 1 hora
REFRESH_TOKEN_LIFETIME = 60 * 60 * 24 * 7 # 7 dias
