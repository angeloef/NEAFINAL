"""Frop — Static context resolver.

Loads always-present context from the harness environment: AGENTS.md,
CLAUDE.md, system prompt, persona, and global constraints.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Dict, List, Optional

from src.state import StaticContext


class StaticContextResolver:
    """Resolves the static (always-loaded) portion of agent context.

    Reads rule files such as AGENTS.md and CLAUDE.md from the project
    root, and populates a ``StaticContext`` TypedDict with system
    instructions, persona, and global constraints.
    """

    RULE_FILE_NAMES: List[str] = ["AGENTS.md", "CLAUDE.md"]
    """Filenames to search for in the project root."""

    def __init__(self) -> None:
        self._system_instructions: str = (
            "You are Frop, a personal coding assistant powered by "
            "DeepSeek. Follow instructions carefully and use the "
            "available tools to accomplish the goal."
        )
        self._persona: Optional[str] = None
        self._global_constraints: List[str] = []

    # ── Public API ──────────────────────────────────────────────────

    def resolve(self, project_root: str) -> StaticContext:
        """Load static context from the given project root directory.

        Scans for AGENTS.md and/or CLAUDE.md, reads their contents,
        and returns a ``StaticContext`` dict.  If neither file exists
        the ``rule_files`` dict will be empty.

        Parameters
        ----------
        project_root : str
            Absolute or relative path to the project root directory.

        Returns
        -------
        StaticContext
            A TypedDict with ``system_instructions``, ``rule_files``,
            ``persona``, and ``global_constraints`` populated.
        """
        root = Path(project_root).expanduser().resolve()
        rule_files: Dict[str, str] = {}

        for fname in self.RULE_FILE_NAMES:
            fpath = root / fname
            if fpath.is_file():
                rule_files[fname] = fpath.read_text(encoding="utf-8")

        # If CLAUDE.md exists, try to extract a persona from it
        persona = self._persona
        if "CLAUDE.md" in rule_files:
            extracted = self._extract_persona_from_claude_md(
                rule_files["CLAUDE.md"]
            )
            if extracted:
                persona = extracted

        # If AGENTS.md exists, try to extract global constraints
        constraints = list(self._global_constraints)
        if "AGENTS.md" in rule_files:
            extracted = self._extract_constraints_from_agents_md(
                rule_files["AGENTS.md"]
            )
            constraints.extend(extracted)

        return {
            "system_instructions": self._system_instructions,
            "rule_files": rule_files,
            "persona": persona,
            "global_constraints": constraints,
        }

    def set_system_instructions(self, instructions: str) -> None:
        """Override the default system instructions.

        Parameters
        ----------
        instructions : str
            New system instruction text.
        """
        self._system_instructions = instructions

    def set_persona(self, persona: str) -> None:
        """Set the agent persona.

        Parameters
        ----------
        persona : str
            Persona description.
        """
        self._persona = persona

    def add_global_constraint(self, constraint: str) -> None:
        """Add a global constraint rule.

        Parameters
        ----------
        constraint : str
            Constraint description (e.g. "never delete user files").
        """
        self._global_constraints.append(constraint)

    # ── Internal helpers ────────────────────────────────────────────

    @staticmethod
    def _extract_persona_from_claude_md(content: str) -> Optional[str]:
        """Attempt to extract a persona description from CLAUDE.md.

        Looks for a ``# Persona`` or ``## Persona`` section heading
        and returns the text that follows it.

        Parameters
        ----------
        content : str
            Raw contents of CLAUDE.md.

        Returns
        -------
        Optional[str]
            The persona text if a section was found, else ``None``.
        """
        lines = content.splitlines()
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.lower().startswith("# persona"):
                remainder_lines = lines[i + 1:]
                parts = []
                for rl in remainder_lines:
                    if rl.startswith("#"):
                        break
                    parts.append(rl)
                text = " ".join(p.strip() for p in parts if p.strip())
                return text if text else None
        return None

    @staticmethod
    def _extract_constraints_from_agents_md(content: str) -> List[str]:
        """Attempt to extract global constraints from AGENTS.md.

        Looks for a ``# Constraints`` or ``## Constraints`` section
        heading and returns list items that follow it.

        Parameters
        ----------
        content : str
            Raw contents of AGENTS.md.

        Returns
        -------
        List[str]
            Extracted constraint descriptions, or an empty list.
        """
        lines = content.splitlines()
        in_section = False
        constraints: List[str] = []
        for line in lines:
            stripped = line.strip()
            if stripped.lower().startswith("# constraints"):
                in_section = True
                continue
            if in_section:
                if stripped.startswith("#"):
                    break
                if stripped.startswith("- ") or stripped.startswith("* "):
                    constraints.append(stripped[2:].strip())
                elif stripped and not stripped.startswith("#"):
                    constraints.append(stripped)
        return constraints
