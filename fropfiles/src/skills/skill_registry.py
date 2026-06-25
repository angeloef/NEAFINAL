"""Frop — Skill Registry (Phase 2).

Stores and manages skill definitions.  Skills follow a two-layer
schema described in ``langgraph_implementation_plan.md`` Section 4.2:

**Layer 1 — DeepSeek tool definition** (OpenAI-compatible ``tools``
array fields): ``name``, ``description``, ``parameters``, ``strict``.

**Layer 2 — Extended metadata** for matching and execution:
``triggers``, ``instructions``, ``example_usage``, ``tools``,
``project_patterns``, ``priority``.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


class SkillRegistry:
    """Stores and manages skill definitions for the 3-tier matching system.

    Skills can be registered programmatically via :meth:`register` or
    loaded in bulk from YAML files via :meth:`register_from_yaml`.

    Parameters
    ----------
    skills_dir : str | Path | None
        Optional default directory to resolve relative YAML paths
        against.  If ``None`` (default) relative paths are resolved
        from the current working directory.
    """

    def __init__(self, skills_dir: str | Path | None = None) -> None:
        self._skills: Dict[str, Dict[str, Any]] = {}
        self._skills_dir: Path | None = Path(skills_dir) if skills_dir else None

    # ── Registration ─────────────────────────────────────────────────

    def register(self, skill: Dict[str, Any]) -> None:
        """Register a single skill definition.

        Parameters
        ----------
        skill : Dict[str, Any]
            Skill dict following the two-layer schema from Section 4.2.
            At minimum it must contain a ``name`` key.

        Raises
        ------
        ValueError
            If the skill dict does not contain a ``name`` field.
        """
        name = skill.get("name")
        if not name:
            raise ValueError("Skill dict must contain a 'name' key.")
        self._skills[name] = skill

    def register_from_yaml(self, yaml_path: str) -> None:
        """Load skill definitions from a YAML file and register them.

        The file may contain a single skill (a top-level mapping) or a
        list of skills under a ``skills`` key.  Each individual skill
        must include a ``name`` field.

        Parameters
        ----------
        yaml_path : str
            Path to the YAML file.  Relative paths are resolved against
            ``skills_dir`` if one was provided at construction time,
            otherwise against the current working directory.

        Raises
        ------
        FileNotFoundError
            If the YAML file does not exist.
        ValueError
            If the YAML content is empty, malformed, or a skill is
            missing its ``name``.
        """
        path = self._resolve_path(yaml_path)

        if not path.exists():
            raise FileNotFoundError(f"YAML skill file not found: {path}")

        with path.open(encoding="utf-8") as fh:
            data = yaml.safe_load(fh)

        if data is None:
            raise ValueError(f"Empty or invalid YAML file: {path}")

        # Determine whether the file contains a single skill or a list.
        if isinstance(data, dict):
            if "skills" in data:
                skills: List[Dict[str, Any]] = data["skills"]
            else:
                skills = [data]
        elif isinstance(data, list):
            skills = data
        else:
            raise ValueError(
                f"Unexpected YAML structure in {path}; expected a mapping or list."
            )

        for skill in skills:
            self.register(skill)

    # ── Querying ─────────────────────────────────────────────────────

    def get(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieve a skill definition by name.

        Parameters
        ----------
        name : str
            The skill's ``name`` field.

        Returns
        -------
        Dict[str, Any] or None
            The full skill dict, or ``None`` if no skill with that name
            is registered.
        """
        return self._skills.get(name)

    def list_all(self) -> List[Dict[str, Any]]:
        """Return every registered skill definition.

        Returns
        -------
        List[Dict[str, Any]]
            All skills currently in the registry.
        """
        return list(self._skills.values())

    def search_by_keywords(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """Find skills whose ``triggers`` overlap with the given keywords.

        A skill matches if *any* of its trigger keywords (case-insensitive
        substring) appears in any of the supplied *keywords*.

        Parameters
        ----------
        keywords : List[str]
            List of keyword strings to match against skill triggers.

        Returns
        -------
        List[Dict[str, Any]]
            Deduplicated list of matching skill definitions.
        """
        lower_keywords = [kw.lower() for kw in keywords]
        matched: List[Dict[str, Any]] = []

        for skill in self._skills.values():
            triggers = [t.lower() for t in skill.get("triggers", [])]
            for trigger in triggers:
                for kw in lower_keywords:
                    if trigger in kw or kw in trigger:
                        matched.append(skill)
                        break
                else:
                    continue
                break

        return matched

    # ── Internal helpers ─────────────────────────────────────────────

    def _resolve_path(self, yaml_path: str) -> Path:
        """Resolve a YAML path relative to ``skills_dir`` if set."""
        p = Path(yaml_path)
        if p.is_absolute():
            return p
        if self._skills_dir is not None:
            return (self._skills_dir / p).resolve()
        return p.resolve()
