"""Frop — Dynamic context manager.

Manages on-demand context retrieval: skills, RAG documents, tool
results, and the session message window.  Maintains sliding windows
so that only the most recent items are retained.
"""

from __future__ import annotations

from typing import Any, Dict, List

from src.state import DynamicContext

# ── Constants ──────────────────────────────────────────────────────────

MAX_TOOL_RESULTS: int = 10
"""Maximum number of recent tool results to keep."""

MAX_SESSION_WINDOW: int = 10
"""Maximum number of recent session messages to keep."""


class DynamicContextManager:
    """Manages the dynamic (on-demand) portion of agent context.

    Accumulates skills, retrieved documents, tool call results, and
    session messages over the course of a graph execution.  Provides
    a ``get_context()`` method that returns a ``DynamicContext``
    TypedDict suitable for use in context assembly.
    """

    def __init__(self) -> None:
        self._active_skills: List[Dict[str, Any]] = []
        self._retrieved_documents: List[Dict[str, Any]] = []
        self._tool_results: List[Dict[str, Any]] = []
        self._session_window: List[str] = []

    # ── Public API ──────────────────────────────────────────────────

    def load_skills(self, skills: List[Dict[str, Any]]) -> None:
        """Set the currently active skills.

        Replaces the previous skill set entirely.

        Parameters
        ----------
        skills : List[Dict[str, Any]]
            List of skill descriptors, each containing at least ``name``
            and ``description`` keys.
        """
        self._active_skills = list(skills)

    def add_retrieved_documents(self, docs: List[Dict[str, Any]]) -> None:
        """Add one or more retrieved (RAG) documents.

        Parameters
        ----------
        docs : List[Dict[str, Any]]
            List of document dicts, each typically containing ``id``,
            ``content``, and ``score`` keys.
        """
        self._retrieved_documents.extend(docs)

    def add_tool_result(self, result: Dict[str, Any]) -> None:
        """Record the result of a tool call.

        Maintains a sliding window of the last ``MAX_TOOL_RESULTS``
        entries.

        Parameters
        ----------
        result : Dict[str, Any]
            Dict describing the tool call, typically with ``tool``,
            ``args``, ``output``, and ``duration`` keys.
        """
        self._tool_results.append(result)
        if len(self._tool_results) > MAX_TOOL_RESULTS:
            self._tool_results = self._tool_results[-MAX_TOOL_RESULTS:]

    def update_session_window(self, messages: List[str]) -> None:
        """Update the recent session message window.

        Maintains a sliding window of the last ``MAX_SESSION_WINDOW``
        entries.

        Parameters
        ----------
        messages : List[str]
            One or more message strings to add to the window.  If the
            combined window exceeds the maximum, older messages are
            discarded.
        """
        self._session_window.extend(messages)
        if len(self._session_window) > MAX_SESSION_WINDOW:
            self._session_window = self._session_window[-MAX_SESSION_WINDOW:]

    def get_context(self) -> DynamicContext:
        """Return the current dynamic context snapshot.

        Returns
        -------
        DynamicContext
            A TypedDict containing ``active_skills``,
            ``retrieved_documents``, ``tool_results``, and
            ``session_window``.
        """
        return {
            "active_skills": list(self._active_skills),
            "retrieved_documents": list(self._retrieved_documents),
            "tool_results": list(self._tool_results),
            "session_window": list(self._session_window),
        }

    def clear(self) -> None:
        """Reset all dynamic context state.

        Clears skills, documents, tool results, and session window.
        """
        self._active_skills.clear()
        self._retrieved_documents.clear()
        self._tool_results.clear()
        self._session_window.clear()
