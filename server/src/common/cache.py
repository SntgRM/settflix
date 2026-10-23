import hashlib
import json
import logging
import random
import time

from src.common import db

log = logging.getLogger("settflix")

_MAX_MEMORY_ENTRIES = 256
_mem = {}  # key → (expira_epoch, valor)


def _key(raw):
    return hashlib.sha256(raw.encode()).hexdigest()


def get(raw_key):
    key = _key(raw_key)
    hit = _mem.get(key)
    if hit and hit[0] > time.time():
        return hit[1]

    try:
        row = db.fetch_one(
            "SELECT payload, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), expires_at) AS ttl "
            "FROM omdb_cache WHERE cache_key = %s AND expires_at > UTC_TIMESTAMP()",
            (key,),
        )
    except Exception:
        log.warning("Caché MySQL no disponible (get)", exc_info=True)
        return None
    if not row:
        return None
    value = json.loads(row["payload"])
    _remember(key, value, row["ttl"])
    return value


def set(raw_key, value, ttl):
    key = _key(raw_key)
    _remember(key, value, ttl)
    try:
        db.execute(
            "REPLACE INTO omdb_cache (cache_key, payload, expires_at) "
            "VALUES (%s, %s, DATE_ADD(UTC_TIMESTAMP(), INTERVAL %s SECOND))",
            (key, json.dumps(value, ensure_ascii=False), int(ttl)),
        )
        if random.random() < 0.1:
            db.execute("DELETE FROM omdb_cache WHERE expires_at < UTC_TIMESTAMP() LIMIT 50")
    except Exception:
        log.warning("Caché MySQL no disponible (set)", exc_info=True)


def _remember(key, value, ttl):
    if len(_mem) >= _MAX_MEMORY_ENTRIES:
        _mem.clear()
    _mem[key] = (time.time() + max(int(ttl), 1), value)
