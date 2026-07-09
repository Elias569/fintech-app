import os
from typing import Optional

import redis

_redis_client: Optional[redis.Redis] = None


def get_redis() -> Optional[redis.Redis]:
    """Optional Redis client. Returns None when REDIS_URL is unset or unreachable."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    url = os.getenv("REDIS_URL", "").strip()
    if not url:
        return None

    try:
        client = redis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=1,
        )
        client.ping()
        _redis_client = client
        return _redis_client
    except Exception as err:
        print(f"[fintech-et][redis] connection error: {err}")
        return None
