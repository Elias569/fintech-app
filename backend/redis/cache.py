import hashlib
import json
from typing import Any, Callable, Optional, TypeVar

from .client import get_redis

KEY_PREFIX = "fintech-et"
T = TypeVar("T")


def _hash_parts(parts: list[str]) -> str:
    normalized = sorted(p.lower() for p in parts)
    digest = hashlib.sha256("|".join(normalized).encode()).hexdigest()
    return digest[:16]


def build_cache_key(namespace: str, parts: list[str]) -> str:
    return f"{KEY_PREFIX}:cache:{namespace}:{_hash_parts(parts)}"


def cache_get_json(key: str, redis=None) -> Optional[Any]:
    client = redis if redis is not None else get_redis()
    if not client:
        return None
    try:
        raw = client.get(key)
        return json.loads(raw) if raw else None
    except Exception as err:
        print(f"[fintech-et][redis] cache_get_json failed: {err}")
        return None


def cache_set_json(key: str, value: Any, ttl_seconds: int, redis=None) -> None:
    client = redis if redis is not None else get_redis()
    if not client:
        return
    try:
        client.set(key, json.dumps(value), ex=ttl_seconds)
    except Exception as err:
        print(f"[fintech-et][redis] cache_set_json failed: {err}")


def get_or_set_json(
    key: str,
    ttl_seconds: int,
    loader: Callable[[], T],
    redis=None,
) -> T:
    cached = cache_get_json(key, redis)
    if cached is not None:
        return cached
    value = loader()
    cache_set_json(key, value, ttl_seconds, redis)
    return value
