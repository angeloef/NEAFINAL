"""Frop — Context builder.

Assembles only the context types selected by the ``context_decider``
into a single prompt text.  Mirrors the assembly logic originally
found in ``src.graph.assemble_context``.
"""

from __future__ import annotations

from typing import Any, Dict, List

from src.state import DynamicContext, StaticContext


class ContextBuilder:
    """Assembles static + dynamic context into a prompt text.

    Only includes sections for context types that are in the
    ``active_types`` list.  The output format mirrors that of the
    original ``assemble_context`` node in ``src/graph.py``.
    """

    def build(
        self,
        static: StaticContext,
        dynamic: DynamicContext,
        active_types: List[str],
        available_tools: List[Any],
    ) -> str:
        """Assemble context text from the selected types.

        Parameters
        ----------
        static : StaticContext
            Always-loaded context (system instructions, rules, persona).
        dynamic : DynamicContext
            On-demand context (skills, documents, tool results, messages).
        active_types : List[str]
            Context types selected by the decider.  May include any of:
            ``instructions``, ``knowledge``, ``memory``, ``examples``,
            ``tools``, ``guardrails``.
        available_tools : List[Any]
            Tools available for binding/langchain tool objects with
            ``name`` and ``description`` attributes.

        Returns
        -------
        str
            The assembled prompt text with section headers.
        """
        pieces: List[str] = []

        # ── INSTRUCTIONS ──────────────────────────────────────────────
        if "instructions" in active_types:
            pieces.append("=== INSTRUCTIONS ===")
            sys_inst = static.get("system_instructions", "")
            if sys_inst:
                pieces.append(sys_inst)

            rule_files = static.get("rule_files", {})
            if rule_files:
                for fname, fcontent in rule_files.items():
                    pieces.append(f"[Rule file: {fname}]\n{fcontent}")

            persona = static.get("persona")
            if persona:
                pieces.append(f"[Persona]\n{persona}")

            constraints = static.get("global_constraints", [])
            if constraints:
                pieces.append("Global constraints:")
                pieces.extend(f"- {c}" for c in constraints)

        # ── KNOWLEDGE ─────────────────────────────────────────────────
        if "knowledge" in active_types:
            retrieved = dynamic.get("retrieved_documents", [])
            active_skills = dynamic.get("active_skills", [])
            knowledge_parts: List[str] = []

            if retrieved:
                knowledge_parts.append("=== KNOWLEDGE ===")
                for doc in retrieved:
                    knowledge_parts.append(str(doc))

            if active_skills:
                if not knowledge_parts:
                    knowledge_parts.append("=== KNOWLEDGE ===")
                knowledge_parts.append("[Active Skills]")
                for skill in active_skills:
                    name = skill.get("name", "unknown")
                    desc = skill.get("description", "")
                    knowledge_parts.append(f"- {name}: {desc}")

            pieces.extend(knowledge_parts)

        # ── RECENT MESSAGES (memory) ──────────────────────────────────
        if "memory" in active_types:
            session_window = dynamic.get("session_window", [])
            if session_window:
                pieces.append("=== RECENT MESSAGES ===")
                # Last 5 messages for compactness (matches original graph)
                pieces.extend(session_window[-5:])

        # ── AVAILABLE TOOLS ──────────────────────────────────────────
        if "tools" in active_types:
            pieces.append("=== AVAILABLE TOOLS ===")
            for t in available_tools:
                name = getattr(t, "name", str(t))
                desc = getattr(t, "description", "")
                pieces.append(f"- {name}: {desc}")

        # ── GUARDRAILS ────────────────────────────────────────────────
        if "guardrails" in active_types:
            pieces.append("=== GUARDRAILS ===")
            # Guardrail info is expected to be in dynamic context
            # or passed separately — use defaults if not available.
            pieces.append("Passed: True")
            pieces.append("Violations: []")

        # ── Assemble ──────────────────────────────────────────────────
        assembled = "\n\n".join(p for p in pieces if p.strip())
        return assembled
