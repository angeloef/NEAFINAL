"""Frop — Skill Matcher (Phase 2).

3-tier matching pipeline that selects relevant skills for a given goal:

**Tier 1 (keyword)** — quick lexical match against skill triggers.
**Tier 2 (embedding)** — semantic similarity via sentence-transformers.
**Tier 3 (LLM fallback)** — ``deepseek-v4-flash`` selects relevant skills
  when no match is found in tiers 1-2.

Tier 2 (sentence-transformers) is an optional dependency: if the package
is not installed the matcher skips this tier silently.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional, Set

from langchain_openai import ChatOpenAI

from src.skills.skill_registry import SkillRegistry

# ── Optional sentence-transformers import ─────────────────────────────

_SENTENCE_TRANSFORMERS_AVAILABLE: bool = False
try:
    import sentence_transformers  # noqa: F401

    _SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    pass


# ── Constants ─────────────────────────────────────────────────────────

DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"

_DEFAULT_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
_DEFAULT_MATCH_THRESHOLD: float = 0.75


# ── Matcher ───────────────────────────────────────────────────────────


class SkillMatcher:
    """3-tier skill matching pipeline.

    Parameters
    ----------
    registry : SkillRegistry
        The skill registry containing all candidate skills.
    embedding_model_name : str
        Hugging Face model name for sentence-transformers
        (default: ``all-MiniLM-L6-v2``).
    match_threshold : float
        Cosine-similarity threshold for tier-2 embedding matching
        (default: ``0.75``).
    llm_model_name : str
        Model name used for tier-3 LLM fallback
        (default: ``deepseek-v4-flash``).
    """

    def __init__(
        self,
        registry: SkillRegistry,
        embedding_model_name: str = _DEFAULT_EMBEDDING_MODEL,
        match_threshold: float = _DEFAULT_MATCH_THRESHOLD,
        llm_model_name: str = "deepseek-v4-flash",
    ) -> None:
        self._registry = registry
        self._embedding_model_name = embedding_model_name
        self._match_threshold = match_threshold
        self._llm_model_name = llm_model_name

        # Lazy-loaded embedding model (only if sentence-transformers is available).
        self._embedder: Any = None

    # ── Public API ───────────────────────────────────────────────────

    def match(
        self,
        goal: str,
        task_description: str,
    ) -> List[Dict[str, Any]]:
        """Run the 3-tier matching pipeline.

        Tiers are evaluated in order and the first non-empty result
        short-circuits further tiers (with the exception of tier 1 +
        tier 2 being combined when both produce matches).

        Parameters
        ----------
        goal : str
            The user's high-level goal description.
        task_description : str
            A more specific description of the current task or step.

        Returns
        -------
        List[Dict[str, Any]]
            Deduplicated list of matched skill definitions,
            ordered by priority (high > medium > low).
        """
        combined_task = f"{goal} {task_description}".strip()

        # ── Tier 1: Keyword match ────────────────────────────────────
        t1_matches = self._tier1_keyword(combined_task)
        matched_names: Set[str] = {s["name"] for s in t1_matches}

        # ── Tier 2: Embedding match ──────────────────────────────────
        t2_matches: List[Dict[str, Any]] = []
        if _SENTENCE_TRANSFORMERS_AVAILABLE:
            t2_matches = self._tier2_embedding(combined_task)
            for s in t2_matches:
                if s["name"] not in matched_names:
                    matched_names.add(s["name"])
        else:
            t2_matches = []

        # ── Combine tiers 1 + 2 ──────────────────────────────────────
        combined = t1_matches + [s for s in t2_matches if s["name"] not in {m["name"] for m in t1_matches}]

        # ── Tier 3: LLM fallback ─────────────────────────────────────
        if not combined:
            t3_matches = self._tier3_llm(goal, task_description)
            combined = [s for s in t3_matches if s["name"] not in matched_names]

        # ── Deduplicate & sort by priority ───────────────────────────
        seen: Set[str] = set()
        deduped: List[Dict[str, Any]] = []
        for skill in combined:
            if skill["name"] not in seen:
                seen.add(skill["name"])
                deduped.append(skill)

        deduped.sort(key=_priority_sort_key, reverse=True)
        return deduped

    # ── Tier 1: Keyword ──────────────────────────────────────────────

    def _tier1_keyword(self, text: str) -> List[Dict[str, Any]]:
        """Check task words against skill triggers.

        Extracts lowercase alphanumeric words from *text* and looks for
        any skill whose triggers contain a substring or exact match.

        Parameters
        ----------
        text : str
            Combined goal + task description.

        Returns
        -------
        List[Dict[str, Any]]
            Matching skill definitions.
        """
        words = re.findall(r"[a-zA-Z_][a-zA-Z0-9_]*", text.lower())
        words = list(set(words))  # deduplicate

        if not words:
            return []

        return self._registry.search_by_keywords(words)

    # ── Tier 2: Embedding ────────────────────────────────────────────

    def _tier2_embedding(self, text: str) -> List[Dict[str, Any]]:
        """Compute semantic similarity between task text and skill descriptions.

        Returns skills whose cosine similarity exceeds
        ``self._match_threshold``.

        Parameters
        ----------
        text : str
            Combined goal + task description.

        Returns
        -------
        List[Dict[str, Any]]
            Matching skill definitions.
        """
        if not _SENTENCE_TRANSFORMERS_AVAILABLE:
            return []

        embedder = self._get_embedder()
        if embedder is None:
            return []

        skills = self._registry.list_all()
        if not skills:
            return []

        skill_texts = [_skill_corpus(s) for s in skills]
        all_texts = [text] + skill_texts
        embeddings = embedder.encode(all_texts, convert_to_tensor=True)

        query_emb = embeddings[0]
        skill_embs = embeddings[1:]

        matched: List[Dict[str, Any]] = []
        for i, skill in enumerate(skills):
            similarity = float(skill_embs[i] @ query_emb) / (
                float(skill_embs[i].norm() * query_emb.norm()) + 1e-10
            )
            if similarity >= self._match_threshold:
                matched.append(skill)

        return matched

    # ── Tier 3: LLM fallback ─────────────────────────────────────────

    def _tier3_llm(
        self,
        goal: str,
        task_description: str,
    ) -> List[Dict[str, Any]]:
        """Use deepseek-v4-flash to select relevant skills from the registry.

        Constructs a prompt listing all available skills and asks the
        LLM to return the names of the ones relevant to the current task.

        Parameters
        ----------
        goal : str
            User goal description.
        task_description : str
            Current task description.

        Returns
        -------
        List[Dict[str, Any]]
            Skill definitions selected by the LLM.
        """
        skills = self._registry.list_all()
        if not skills:
            return []

        # Build a compact listing of available skills.
        skill_listings = []
        for s in skills:
            triggers = ", ".join(s.get("triggers", []))
            skill_listings.append(
                f"- {s['name']}: {s.get('description', '')}"
                + (f"  [triggers: {triggers}]" if triggers else "")
            )

        prompt = (
            "You are a skill selector. Given a user goal and task description, "
            "select the most relevant skills from the list below.\n\n"
            "Available skills:\n"
            + "\n".join(skill_listings)
            + "\n\n"
            f"Goal: {goal}\n"
            f"Task: {task_description}\n\n"
            'Respond with ONLY a JSON array of skill names, e.g. [\"debugging_with_pdb\"]. '
            "Return an empty array [] if none are relevant. "
            "No additional explanation."
        )

        llm = ChatOpenAI(
            model=self._llm_model_name,
            base_url=DEEPSEEK_BASE_URL,
            api_key=DEEPSEEK_API_KEY,
            temperature=0,
        )

        response = llm.invoke(prompt)
        content = response.content.strip() if response.content else "[]"

        # Strip markdown fences if present.
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)

        try:
            names: List[str] = json.loads(content)
        except (json.JSONDecodeError, TypeError):
            return []

        if not isinstance(names, list):
            return []

        result: List[Dict[str, Any]] = []
        for n in names:
            skill = self._registry.get(n)
            if skill is not None:
                result.append(skill)
        return result

    # ── Internal helpers ─────────────────────────────────────────────

    def _get_embedder(self) -> Any:
        """Lazy-load the sentence-transformers embedding model.

        Returns
        -------
        SentenceTransformer or None
        """
        if self._embedder is not None:
            return self._embedder
        if not _SENTENCE_TRANSFORMERS_AVAILABLE:
            return None

        from sentence_transformers import SentenceTransformer  # type: ignore[import-untyped]

        self._embedder = SentenceTransformer(self._embedding_model_name)
        return self._embedder


# ── Module-level helpers ──────────────────────────────────────────────


def _skill_corpus(skill: Dict[str, Any]) -> str:
    """Build a single text corpus from a skill definition for embedding.

    Concatenates the name, description, triggers, and instructions so
    that the embedding captures the skill's full semantics.

    Parameters
    ----------
    skill : Dict[str, Any]
        A skill definition dict.

    Returns
    -------
    str
        Flattened text corpus.
    """
    parts = [
        skill.get("name", ""),
        skill.get("description", ""),
        " ".join(skill.get("triggers", [])),
        skill.get("instructions", ""),
    ]
    return " ".join(p for p in parts if p)


def _priority_sort_key(skill: Dict[str, Any]) -> int:
    """Convert priority string to a numeric sort key (high=3, medium=2, low=1)."""
    mapping = {"high": 3, "medium": 2, "low": 1}
    return mapping.get(skill.get("priority", "medium"), 2)
