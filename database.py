"""
database.py — SQLite-backed threat storage for CYNAPSE AI.
Uses aiosqlite for async access. Stores anonymised analysis outputs only.
"""

import aiosqlite
import uuid
import json
from datetime import datetime, timezone

DB_PATH = "cynapse.db"


async def init_db():
    """Create the threats table if it doesn't exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS threats (
                id           TEXT PRIMARY KEY,
                feature      TEXT,
                input_hash   TEXT,
                verdict      TEXT,
                risk_score   INTEGER,
                evidence     TEXT,
                created_at   TEXT
            )
        """)
        await db.commit()


async def store_threat(feature: str, input_hash: str, verdict: str,
                       risk_score: int, evidence: dict) -> str:
    """Insert a new threat analysis result and return the generated UUID."""
    threat_id = str(uuid.uuid4())
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO threats (id, feature, input_hash, verdict, risk_score, evidence, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                threat_id,
                feature,
                input_hash,
                verdict,
                risk_score,
                json.dumps(evidence),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        await db.commit()
    return threat_id
