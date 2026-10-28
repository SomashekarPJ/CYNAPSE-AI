"""
cache.py — In-memory cache (Redis-compatible interface fallback).
Caches analysis results to avoid re-processing identical inputs.
"""

import time
import json
from typing import Optional

# Simple in-memory cache with TTL support
_cache: dict[str, tuple[float, str]] = {}

DEFAULT_TTL = 300  # 5 minutes


def cache_get(key: str) -> Optional[dict]:
    """Retrieve a cached result by key. Returns None if expired or missing."""
    if key in _cache:
        expiry, value = _cache[key]
        if time.time() < expiry:
            return json.loads(value)
        else:
            del _cache[key]
    return None


def cache_set(key: str, value: dict, ttl: int = DEFAULT_TTL):
    """Store a result in cache with a TTL (seconds)."""
    _cache[key] = (time.time() + ttl, json.dumps(value))


def cache_clear():
    """Flush the entire cache."""
    _cache.clear()
