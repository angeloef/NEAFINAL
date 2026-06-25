"""
Frop — PostgreSQL-backed LangGraph Checkpointer (Phase 2)

Provides a factory function ``create_postgres_checkpointer()`` that
returns a ``PostgresSaver`` instance for persisting LangGraph
execution state.  PostgreSQL and the ``langgraph`` checkpointer
package are optional — the function returns ``None`` and logs a
warning if either is unavailable.

Dependencies
------------
- ``asyncpg`` (optional; for the async checkpointer)
- ``langgraph.checkpoint.postgres`` (optional; part of ``langgraph``)
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Both ``langgraph.checkpoint.postgres`` and ``asyncpg`` are optional.
try:
    from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

    HAS_LANGGRAPH_CHECKPOINTER = True
except ImportError:
    try:
        from langgraph.checkpoint.postgres import PostgresSaver

        HAS_LANGGRAPH_CHECKPOINTER = True
    except ImportError:
        HAS_LANGGRAPH_CHECKPOINTER = False
        logger.warning(
            "langgraph.checkpoint.postgres is not available. "
            "Install with: pip install 'langgraph[postgres]' "
            "(or pip install asyncpg langgraph). "
            "create_postgres_checkpointer() will return None."
        )


def create_postgres_checkpointer(dsn: str) -> Optional[object]:
    """Create a PostgreSQL-backed checkpointer for LangGraph.

    Attempts to connect to the PostgreSQL instance at *dsn* and return
    a configured ``PostgresSaver`` / ``AsyncPostgresSaver`` instance.

    Parameters
    ----------
    dsn : str
        PostgreSQL connection string
        (e.g. ``postgresql://user:pass@localhost:5432/hermes_memory``).

    Returns
    -------
    Optional[PostgresSaver | AsyncPostgresSaver]
        A fully initialised checkpointer, or ``None`` if the required
        packages are missing or the connection fails.
    """
    if not HAS_LANGGRAPH_CHECKPOINTER:
        logger.warning(
            "create_postgres_checkpointer: langgraph.checkpoint.postgres "
            "not available — returning None."
        )
        return None

    if not dsn:
        logger.warning("create_postgres_checkpointer: empty DSN — returning None.")
        return None

    try:
        # AsyncPostgresSaver is imported above; PostgresSaver is the
        # synchronous variant.  We prefer the sync one for simplicity.
        from langgraph.checkpoint.postgres import PostgresSaver

        checkpointer = PostgresSaver.from_conn_string(dsn)
        logger.info("PostgreSQL checkpointer created and connected.")
        return checkpointer
    except Exception as exc:
        logger.warning(
            "create_postgres_checkpointer: failed to initialise — %s. "
            "Returning None.",
            exc,
        )
        return None
