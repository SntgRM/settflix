import pymysql
from pymysql.cursors import DictCursor

from src.common import config

_conn = None

_RECONNECT_CODES = {0, 2006, 2013}


def _connect():
    return pymysql.connect(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=True,
        connect_timeout=5,
        read_timeout=10,
        write_timeout=10,
    )


def _reset():
    global _conn
    try:
        if _conn is not None:
            _conn.close()
    except Exception:
        pass
    _conn = None


def _run(sql, args, mode):
    global _conn
    for attempt in (1, 2):
        try:
            if _conn is None:
                _conn = _connect()
            with _conn.cursor() as cur:
                cur.execute(sql, args)
                if mode == "one":
                    return cur.fetchone()
                if mode == "all":
                    return cur.fetchall()
                return cur.rowcount, cur.lastrowid
        except (pymysql.err.InterfaceError, pymysql.err.OperationalError) as exc:
            code = exc.args[0] if exc.args else 0
            _reset()
            if attempt == 2 or code not in _RECONNECT_CODES:
                raise


def fetch_one(sql, args=None):
    return _run(sql, args, "one")


def fetch_all(sql, args=None):
    return _run(sql, args, "all")


def execute(sql, args=None):
    return _run(sql, args, "exec")
