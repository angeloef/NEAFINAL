"""Frop — Skill Loader (Phase 2).

Loads matched skills into the agent's dynamic context and generates
the system-prompt fragment that informs the LLM which skills it has
access to.
"""

from __future__ import annotations

from typing import Any, Dict, List


def load_skills_into_context(
    skills: List[Dict[str, Any]],
    dynamic_manager: Any,
) -> None:
    """Inject matched skill definitions into the dynamic context manager.

    Calls ``dynamic_manager.load_skills(skills)`` to make the skills
    available in the agent's runtime context.

    Parameters
    ----------
    skills : List[Dict[str, Any]]
        List of matched skill definitions (from ``SkillMatcher.match``).
    dynamic_manager : DynamicContextManager
        The dynamic context manager instance that holds live context
        state.  It is expected to have a ``load_skills`` method that
        accepts the skill list.

    Raises
    ------
    AttributeError
        If *dynamic_manager* does not expose a ``load_skills`` method.
    """
    if not skills:
        return

    if not hasattr(dynamic_manager, "load_skills"):
        raise AttributeError(
            f"{type(dynamic_manager).__name__} has no 'load_skills' method. "
            "Cannot load skills into context."
        )

    dynamic_manager.load_skills(skills)


def build_skill_system_prompt(skills: List[Dict[str, Any]]) -> str:
    """Generate the ``You have the following skills loaded`` system-prompt text.

    Each skill is rendered as a numbered entry containing its name,
    description, parameter schema, and usage instructions.

    Parameters
    ----------
    skills : List[Dict[str, Any]]
        List of skill definitions to render into the prompt.

    Returns
    -------
    str
        Formatted system-prompt fragment, or an empty string if the
        list is empty.
    """
    if not skills:
        return ""

    lines: List[str] = [
        "You have the following skills loaded.  Use them when the task requires their expertise:",
        "",
    ]

    for idx, skill in enumerate(skills, start=1):
        name = skill.get("name", "unnamed_skill")
        description = skill.get("description", "")
        parameters = skill.get("parameters", {})
        instructions = skill.get("instructions", "")
        example = skill.get("example_usage", "")
        required_tools = skill.get("tools", [])

        lines.append(f"{idx}. {name}")
        if description:
            lines.append(f"   Description: {description}")

        # Parameter summary
        props = parameters.get("properties", {})
        required_params = parameters.get("required", [])
        if props:
            lines.append("   Parameters:")
            for param_name, param_schema in props.items():
                req = " (required)" if param_name in required_params else ""
                param_desc = param_schema.get("description", "")
                param_type = param_schema.get("type", "any")
                lines.append(
                    f"      - {param_name}: {param_type}{req} — {param_desc}"
                )

        if instructions:
            lines.append(f"   Instructions: {instructions[:200].strip()}")

        if example:
            lines.append(f"   Usage example: {example[:150].strip()}")

        if required_tools:
            lines.append(f"   Required tools: {', '.join(required_tools)}")

        lines.append("")  # blank line between skills

    return "\n".join(lines)
