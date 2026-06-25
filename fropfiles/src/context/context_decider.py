"""Frop — LLM-driven context type decider.

Replaces the inlined ``context_decider`` function in ``src/graph.py``.
Uses ``deepseek-v4-flash`` to select which of the six context types
(instructions, knowledge, memory, examples, tools, guardrails) are
needed for the current execution step.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from src.state import AgentState

# ── Constants ──────────────────────────────────────────────────────────

ALL_CONTEXT_TYPES: List[str] = [
    "instructions",
    "knowledge",
    "memory",
    "examples",
    "tools",
    "guardrails",
]
"""All available context types the decider may select from."""

ALWAYS_INCLUDE: List[str] = ["instructions", "tools"]
"""Context types that are always included regardless of LLM output."""


def get_decider_model() -> ChatOpenAI:
    """Build the ``deepseek-v4-flash`` model used for context decisions.

    Returns
    -------
    ChatOpenAI
        A LangChain ChatOpenAI instance pointing at DeepSeek's API.
    """
    return ChatOpenAI(
        model="deepseek-v4-flash",
        base_url="https://api.deepseek.com",
        api_key=os.environ["DEEPSEEK_API_KEY"],
        temperature=0,
    )


def context_decider(state: AgentState) -> Dict[str, Any]:
    """LLM decides which of the six context types are needed for this step.

    Uses ``deepseek-v4-flash`` to select from:
    ``instructions``, ``knowledge``, ``memory``, ``examples``,
    ``tools``, ``guardrails``.

    Parameters
    ----------
    state : AgentState
        Current graph state with goal description and existing context.

    Returns
    -------
    Dict[str, Any]
        Partial state update with ``active_context_types`` set inside
        the ``context`` payload. Defaults to ``["instructions", "tools"]``
        if the LLM call fails or returns invalid JSON.
    """
    goal_desc = state["goal"]["description"]
    flash = get_decider_model()

    system_msg = SystemMessage(
        content=(
            "You are a context engineer. Given a goal, decide which "
            "context types are required. Always include 'instructions' "
            "and 'tools'. Optionally include any of the others.\n\n"
            "All context types:\n"
            f"{ALL_CONTEXT_TYPES}\n\n"
            "Respond with a JSON array of strings, e.g.:\n"
            '["instructions", "tools", "knowledge"]'
        )
    )
    human_msg = HumanMessage(content=f"Goal: {goal_desc}")

    response: AIMessage = AIMessage(content="")
    selected: List[str] = list(ALWAYS_INCLUDE)

    try:
        response = flash.invoke([system_msg, human_msg])  # type: ignore[arg-type]
        raw = response.content
        if isinstance(raw, str):
            selected = json.loads(raw.strip())
        elif isinstance(raw, list):
            # Some LangChain versions return content as a list of blocks
            text_parts = [
                b.get("text", "") for b in raw if isinstance(b, dict)
            ]
            selected = json.loads("".join(text_parts).strip())
        else:
            selected = list(ALWAYS_INCLUDE)

        if not isinstance(selected, list):
            selected = list(ALWAYS_INCLUDE)
    except (json.JSONDecodeError, AttributeError, KeyError, Exception):
        selected = list(ALWAYS_INCLUDE)

    # Ensure always-included types are present and at front
    for required in ALWAYS_INCLUDE:
        if required not in selected:
            selected.insert(0, required)

    new_messages = list(state.get("messages", [])) + [human_msg, response]

    return {
        "context": {
            **state["context"],
            "active_context_types": selected,
        },
        "messages": new_messages,
        "observability": {
            **state.get("observability", {}),
            "model_calls": state.get("observability", {}).get("model_calls", [])
            + [{"model": "deepseek-v4-flash", "node": "context_decider"}],
        },
    }
