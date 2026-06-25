"""Frop — Persistence subsystems (Phase 2).

Provides PostgreSQL-backed checkpointing for LangGraph execution
state. All modules degrade gracefully if PostgreSQL is unavailable.
"""
