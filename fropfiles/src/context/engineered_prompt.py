"""Frop — Engineered prompt renderer.

Takes the assembled context and renders it into the final system prompt
string that is sent to the LLM.
"""

from __future__ import annotations

from typing import Optional


def render_system_prompt(
    assembled_context: str,
    persona: Optional[str] = None,
) -> str:
    """Render the full system prompt for the LLM.

    Combines the base agent identity with the assembled context text.
    If a persona is provided it is woven into the identity description.

    Parameters
    ----------
    assembled_context : str
        The context text produced by ``ContextBuilder.build()``.
    persona : Optional[str], optional
        Optional agent persona description (e.g. from CLAUDE.md).

    Returns
    -------
    str
        The complete system prompt string ready to be sent as a
        ``SystemMessage``.
    """
    base_identity = (
        "You are an expert coding assistant powered by deepseek-v4-pro. "
        "Use the available tools to accomplish the goal."
    )

    if persona:
        base_identity = (
            f"You are an expert coding assistant powered by "
            f"deepseek-v4-pro with the following persona:\n\n"
            f"{persona}\n\n"
            f"Use the available tools to accomplish the goal."
        )

    if assembled_context and assembled_context.strip():
        return f"{base_identity}\n\n{assembled_context}"

    return base_identity
