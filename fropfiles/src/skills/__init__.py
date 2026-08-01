"""Frop — Skills Package (Phase 2).

Exports the skill subsystem used by the context engineering layer:

- :class:`SkillRegistry <src.skills.skill_registry.SkillRegistry>` —
  stores and manages skill definitions (register, YAML load, query).
- :class:`SkillMatcher <src.skills.skill_matcher.SkillMatcher>` —
  3-tier matching pipeline (keyword → embedding → LLM fallback).
- :func:`load_skills_into_context <src.skills.skill_loader.load_skills_into_context>` —
  injects matched skills into the dynamic context manager.
- :func:`build_skill_system_prompt <src.skills.skill_loader.build_skill_system_prompt>` —
  generates the system-prompt fragment for actively loaded skills.

Usage::

    from src.skills.skill_registry import SkillRegistry
    from src.skills.skill_matcher import SkillMatcher
    from src.skills.skill_loader import load_skills_into_context

    registry = SkillRegistry()
    registry.register_from_yaml("skills/debugging_with_pdb.yml")
    matcher = SkillMatcher(registry)
    matches = matcher.match("Debug a Python error", "")
"""

from __future__ import annotations
