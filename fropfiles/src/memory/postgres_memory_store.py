"""
Frop — PostgreSQL Key-Value Memory Store (Phase 2)

``PostgresMemoryStore`` provides project-partitioned key-value storage
with automatic diff snapshots for change tracking.  PostgreSQL is
optional — if the connection fails the store operates in no-op mode.

Tables (auto-created on connect)
--------------------------------
- ``project_memory``  — current key-value pairs per project.
- ``memory_diffs``    — change-history log for each key update.

Dependencies
------------
- ``asyncpg`` (optional; no-op if not installed or connection fails)
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any, Dict, Optional
from uuid import uuid4

logger = logging.getLogger(__name__)

try:
    import asyncpg

    HAS_ASYNCPG = True
except ImportError:
    HAS_ASYNCPG = False
    logger.warning("asyncpg is not installed. PostgresMemoryStore will operate in no-op mode.")

if TYPE_CHECKING:
    import asyncpg


class PostgresMemoryStore:
    """Project-partitioned key-value store backed by PostgreSQL.

    Stores arbitrary JSON-serialisable values keyed by
    ``(project_id, key)``.  Every ``set()`` that changes a value also
    writes a diff record to ``memory_diffs`` for audit / rollback.

    If the database connection cannot be established, all operations
    become no-ops and return sensible defaults (``get`` → ``None``,
    ``set`` → no-op, etc.).

    Parameters
    ----------
    dsn : str
        PostgreSQL connection string (e.g. ``postgresql://user:pass@host/db``).
    """

    def __init__(self, dsn: str) -> None:
        self._dsn = dsn
        self._pool: Optional[asyncpg.Pool] = None
        self._noop = not HAS_ASYNCPG

    # ── Lifecycle ──────────────────────────────────────────────────────

    async def connect(self) -> None:
        """Create a connection pool and ensure tables exist.

        If the connection fails or ``asyncpg`` is not installed, the
        store degrades to no-op mode and logs a warning.
        """
        if self._noop or not HAS_ASYNCPG:
            logger.info("PostgresMemoryStore: no-op mode (asyncpg unavailable or noop flag set).")
            return

        try:
            self._pool = await asyncpg.create_pool(
                dsn=self._dsn,
                min_size=1,
                max_size=10,
            )
            logger.info("PostgresMemoryStore: connected to PostgreSQL.")
            await self._ensure_tables()
        except Exception as exc:
            logger.warning(
                "PostgresMemoryStore: connection failed — %s. "
                "Falling back to no-op mode.",
                exc,
            )
            self._noop = True

    async def disconnect(self) -> None:
        """Close the connection pool if open."""
        if self._pool is not None:
            await self._pool.close()
            self._pool = None
            logger.info("PostgresMemoryStore: disconnected.")

    # ── DDL helpers ────────────────────────────────────────────────────

    async def _ensure_tables(self) -> None:
        """Create ``project_memory`` and ``memory_diffs`` if they don't exist."""
        if self._pool is None:
            return

        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS project_memory (
                    id         UUID PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    key        TEXT NOT NULL,
                    value      JSONB NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (project_id, key)
                )
                """
            )
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS memory_diffs (
                    id         UUID PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    key        TEXT NOT NULL,
                    old_value  JSONB,
                    new_value  JSONB,
                    session_id TEXT NOT NULL,
                    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            logger.info("PostgresMemoryStore: tables ensured.")

    # ── Public API ─────────────────────────────────────────────────────

    async def get(self, project_id: str, key: str) -> Optional[Any]:
        """Retrieve the value for *key* under *project_id*.

        Parameters
        ----------
        project_id : str
            Project namespace.
        key : str
            Lookup key.

        Returns
        -------
        Optional[Any]
            Deserialised value, or ``None`` if not found.
        """
        if self._noop or self._pool is None:
            return None

        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT value FROM project_memory WHERE project_id = $1 AND key = $2",
                project_id,
                key,
            )
            if row is None:
                return None
            return json.loads(row["value"])

    async def set(
        self,
        project_id: str,
        key: str,
        value: Any,
        session_id: str = "",
    ) -> None:
        """Upsert *value* for *key* under *project_id* and record a diff.

        If the value differs from the currently stored value, an entry
        is written to ``memory_diffs`` with the old and new values.

        Parameters
        ----------
        project_id : str
            Project namespace.
        key : str
            Lookup key.
        value : Any
            JSON-serialisable value to store.
        session_id : str, optional
            Session identifier for the diff log (default ``""``).
        """
        if self._noop or self._pool is None:
            return

        serialised = json.dumps(value, default=str)

        async with self._pool.acquire() as conn:
            # Fetch the current value
            row = await conn.fetchrow(
                "SELECT value, id FROM project_memory WHERE project_id = $1 AND key = $2",
                project_id,
                key,
            )

            old_value_raw: Optional[str] = None
            if row is not None:
                old_value_raw = row["value"]

            # If the value hasn't changed, skip the write and diff
            if old_value_raw is not None and old_value_raw == serialised:
                return

            # Upsert
            if row is not None:
                await conn.execute(
                    """
                    UPDATE project_memory
                       SET value = $1, updated_at = NOW()
                     WHERE project_id = $2 AND key = $3
                    """,
                    serialised,
                    project_id,
                    key,
                )
            else:
                await conn.execute(
                    """
                    INSERT INTO project_memory (id, project_id, key, value, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                    """,
                    str(uuid4()),
                    project_id,
                    key,
                    serialised,
                )

            # Record the diff
            await conn.execute(
                """
                INSERT INTO memory_diffs (id, project_id, key, old_value, new_value, session_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                str(uuid4()),
                project_id,
                key,
                old_value_raw,
                serialised,
                session_id,
            )

    async def get_all(self, project_id: str) -> Dict[str, Any]:
        """Retrieve all key-value pairs for a project.

        Parameters
        ----------
        project_id : str
            Project namespace.

        Returns
        -------
        Dict[str, Any]
            Mapping of key → deserialised value for every stored pair.
        """
        if self._noop or self._pool is None:
            return {}

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT key, value FROM project_memory WHERE project_id = $1",
                project_id,
            )
            return {row["key"]: json.loads(row["value"]) for row in rows}

    async def delete(self, project_id: str, key: str) -> None:
        """Delete a key from the project's memory.

        Parameters
        ----------
        project_id : str
            Project namespace.
        key : str
            Key to delete.
        """
        if self._noop or self._pool is None:
            return

        async with self._pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM project_memory WHERE project_id = $1 AND key = $2",
                project_id,
                key,
            )
