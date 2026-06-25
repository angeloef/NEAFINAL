"""
Tests for Frop Phase 2 — Context Engineering, Skills, Memory & Graph Integration

Verifies that all Phase 2 modules work correctly and integrate with the
existing graph.  All tests operate without a DeepSeek API key — LLM calls
are mocked at the node / invocation level.
"""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.context.context_builder import ContextBuilder
from src.context.context_decider import context_decider as context_decider_node
from src.context.dynamic_context import DynamicContextManager
from src.context.engineered_prompt import render_system_prompt
from src.context.static_context import StaticContextResolver
from src.graph import assemble_context, build_graph, context_decider, default_state
from src.memory.postgres_memory_store import PostgresMemoryStore
from src.skills.skill_matcher import SkillMatcher
from src.skills.skill_registry import SkillRegistry
from src.state import AgentState


# =========================================================================
# context_decider
# =========================================================================


def _make_context_decider_state() -> AgentState:
    """Return a minimal AgentState for context_decider tests."""
    return {
        "goal": {
            "description": "Build a FastAPI endpoint",
            "success_criteria": [],
            "constraints": [],
            "priority": "medium",
            "project_id": "test",
        },
        "plan": {"steps": [], "status": "draft"},
        "context": {
            "static": {
                "system_instructions": "",
                "rule_files": {},
                "persona": None,
                "global_constraints": [],
            },
            "dynamic": {
                "active_skills": [],
                "retrieved_documents": [],
                "tool_results": [],
                "session_window": [],
            },
            "assembled_text": "",
            "active_context_types": [],
        },
        "short_term": {"last_action": None, "last_result": None, "iteration_count": 0},
        "long_term": {
            "project_knowledge": {},
            "behavioral_rules": [],
            "skill_usage_stats": {},
            "checkpoints": [],
        },
        "current_step": None,
        "messages": [],
        "intermediate_outputs": [],
        "active_model": None,
        "model_route_decisions": [],
        "guardrail": {"passed": True, "violations": [], "auto_fix_applied": None},
        "human_review_requests": [],
        "observability": {
            "trace_id": "",
            "model_calls": [],
            "tool_calls": [],
            "trajectory": [],
            "cost_estimate": 0.0,
        },
        "remaining_retries": 3,
        "loop_count": 0,
        "status": "running",
    }


def test_context_decider_returns_valid_types():
    """Mock ChatOpenAI, verify active_context_types includes 'instructions' and 'tools'."""
    state = _make_context_decider_state()

    mock_response = MagicMock()
    mock_response.content = json.dumps(["instructions", "tools", "knowledge"])
    mock_model = MagicMock()
    mock_model.invoke.return_value = mock_response

    with patch(
        "src.context.context_decider.get_decider_model", return_value=mock_model
    ):
        result = context_decider_node(state)

    assert "context" in result
    active_types = result["context"]["active_context_types"]
    assert "instructions" in active_types
    assert "tools" in active_types
    assert "knowledge" in active_types


def test_context_decider_fallback_on_failure():
    """If the LLM call fails, fallback to ['instructions', 'tools']."""
    state = _make_context_decider_state()

    mock_model = MagicMock()
    mock_model.invoke.side_effect = Exception("API error")

    with patch(
        "src.context.context_decider.get_decider_model", return_value=mock_model
    ):
        result = context_decider_node(state)

    assert "context" in result
    active_types = result["context"]["active_context_types"]
    assert "instructions" in active_types
    assert "tools" in active_types


def test_context_decider_ensures_required_types():
    """Even if LLM omits 'instructions' or 'tools', they are always included."""
    state = _make_context_decider_state()

    mock_response = MagicMock()
    mock_response.content = json.dumps(["knowledge", "guardrails"])
    mock_model = MagicMock()
    mock_model.invoke.return_value = mock_response

    with patch(
        "src.context.context_decider.get_decider_model", return_value=mock_model
    ):
        result = context_decider_node(state)

    active_types = result["context"]["active_context_types"]
    assert "instructions" in active_types
    assert "tools" in active_types


# =========================================================================
# StaticContextResolver
# =========================================================================


def test_static_context_resolver():
    """Create tmp dir with AGENTS.md, verify resolution."""
    resolver = StaticContextResolver()

    with tempfile.TemporaryDirectory() as tmpdir:
        agents_md = tmpdir / Path("AGENTS.md") if hasattr(tmpdir, "joinpath") else Path(tmpdir) / "AGENTS.md"
        # Use os.path.join for reliability
        agents_path = os.path.join(tmpdir, "AGENTS.md")
        with open(agents_path, "w", encoding="utf-8") as f:
            f.write("# Constraints\n- Never delete user files\n- Always ask before destructive operations")

        result = resolver.resolve(tmpdir)

    assert isinstance(result, dict)
    assert "system_instructions" in result
    assert "rule_files" in result
    assert "AGENTS.md" in result["rule_files"]
    assert "Never delete user files" in result["rule_files"]["AGENTS.md"]


def test_static_context_resolver_empty_dir():
    """An empty directory should produce a valid StaticContext with no rule files."""
    resolver = StaticContextResolver()

    with tempfile.TemporaryDirectory() as tmpdir:
        result = resolver.resolve(tmpdir)

    assert isinstance(result, dict)
    assert result["rule_files"] == {}
    assert result["persona"] is None
    assert result["global_constraints"] == []


def test_static_context_resolver_with_claude_md_persona():
    """Verify persona extraction from CLAUDE.md."""
    resolver = StaticContextResolver()

    with tempfile.TemporaryDirectory() as tmpdir:
        claude_path = os.path.join(tmpdir, "CLAUDE.md")
        with open(claude_path, "w", encoding="utf-8") as f:
            f.write(
                "# Persona\nYou are an expert Python developer with deep "
                "knowledge of FastAPI and async programming.\n\n"
                "# Other section\nSome content here."
            )

        result = resolver.resolve(tmpdir)

    assert "CLAUDE.md" in result["rule_files"]
    assert result["persona"] is not None
    assert "expert Python developer" in result["persona"]


# =========================================================================
# DynamicContextManager
# =========================================================================


def test_dynamic_context_manager_basic():
    """Basic usage of DynamicContextManager."""
    mgr = DynamicContextManager()
    ctx = mgr.get_context()
    assert ctx["active_skills"] == []
    assert ctx["retrieved_documents"] == []
    assert ctx["tool_results"] == []
    assert ctx["session_window"] == []


def test_dynamic_context_manager_sliding_windows():
    """Verify tool_results and session_window cap at 10."""
    mgr = DynamicContextManager()

    # Add 15 tool results — only last 10 should remain
    for i in range(15):
        mgr.add_tool_result({"tool": f"tool_{i}", "args": {}, "output": str(i)})

    ctx = mgr.get_context()
    assert len(ctx["tool_results"]) == 10
    assert ctx["tool_results"][0]["tool"] == "tool_5"  # first of the last 10
    assert ctx["tool_results"][-1]["tool"] == "tool_14"

    # Add 15 session messages — only last 10 should remain
    for i in range(15):
        mgr.update_session_window([f"message_{i}"])

    ctx = mgr.get_context()
    assert len(ctx["session_window"]) == 10
    assert ctx["session_window"][0] == "message_5"
    assert ctx["session_window"][-1] == "message_14"


def test_dynamic_context_manager_clear():
    """Verify clear() resets all state."""
    mgr = DynamicContextManager()
    mgr.add_tool_result({"tool": "test"})
    mgr.update_session_window(["hello"])
    mgr.load_skills([{"name": "test_skill", "description": "A test"}])

    mgr.clear()
    ctx = mgr.get_context()
    assert ctx["active_skills"] == []
    assert ctx["tool_results"] == []
    assert ctx["session_window"] == []


# =========================================================================
# ContextBuilder
# =========================================================================


def test_context_builder_produces_sections():
    """Verify sections are present when corresponding types are active."""
    builder = ContextBuilder()

    static = {
        "system_instructions": "Follow the rules.",
        "rule_files": {"AGENTS.md": "# Rules\n- Be careful"},
        "persona": None,
        "global_constraints": ["Never delete files"],
    }
    dynamic = {
        "active_skills": [{"name": "git", "description": "Git operations"}],
        "retrieved_documents": [{"id": "doc1", "content": "Some knowledge"}],
        "tool_results": [],
        "session_window": ["msg1", "msg2", "msg3"],
    }
    active_types = ["instructions", "knowledge", "memory", "tools"]
    tools = []

    result = builder.build(static, dynamic, active_types, tools)

    assert "=== INSTRUCTIONS ===" in result
    assert "Follow the rules." in result
    assert "Never delete files" in result
    assert "=== KNOWLEDGE ===" in result
    assert "Some knowledge" in result
    assert "=== RECENT MESSAGES ===" in result
    assert "msg1" in result
    assert "=== AVAILABLE TOOLS ===" in result
    assert "=== GUARDRAILS ===" not in result  # not in active_types


def test_context_builder_empty_active_types():
    """When no types are active, the builder returns an empty string."""
    builder = ContextBuilder()
    result = builder.build(
        static={
            "system_instructions": "Test",
            "rule_files": {},
            "persona": None,
            "global_constraints": [],
        },
        dynamic={
            "active_skills": [],
            "retrieved_documents": [],
            "tool_results": [],
            "session_window": [],
        },
        active_types=[],
        available_tools=[],
    )
    assert result == ""


# =========================================================================
# SkillRegistry
# =========================================================================


def test_skill_registry_register_and_search():
    """Register sample skill, search by keywords."""
    registry = SkillRegistry()

    registry.register(
        {
            "name": "debugging_with_pdb",
            "description": "Debug Python code using pdb",
            "triggers": ["debug", "pdb", "trace", "breakpoint"],
            "priority": "high",
        }
    )
    registry.register(
        {
            "name": "git_operations",
            "description": "Perform Git operations",
            "triggers": ["git", "commit", "push", "pull"],
            "priority": "medium",
        }
    )

    # Get by name
    skill = registry.get("debugging_with_pdb")
    assert skill is not None
    assert skill["name"] == "debugging_with_pdb"

    # Search by keywords
    results = registry.search_by_keywords(["debug", "traceback"])
    assert len(results) >= 1
    names = [s["name"] for s in results]
    assert "debugging_with_pdb" in names

    # Non-matching search
    results = registry.search_by_keywords(["unrelated"])
    assert len(results) == 0


def test_skill_registry_register_requires_name():
    """Registering a skill without a name raises ValueError."""
    registry = SkillRegistry()
    with pytest.raises(ValueError, match="name"):
        registry.register({"description": "No name here"})


def test_skill_registry_list_all():
    """list_all returns all registered skills."""
    registry = SkillRegistry()
    registry.register({"name": "a", "description": "Skill A"})
    registry.register({"name": "b", "description": "Skill B"})
    assert len(registry.list_all()) == 2


# =========================================================================
# SkillMatcher (tier 1 — keyword)
# =========================================================================


def test_skill_matcher_tier1_keyword():
    """Tier 1 matches by trigger keywords."""
    registry = SkillRegistry()
    registry.register(
        {
            "name": "debugging_with_pdb",
            "description": "Debug Python with pdb",
            "triggers": ["debug", "pdb"],
            "priority": "high",
        }
    )
    registry.register(
        {
            "name": "git_operations",
            "description": "Git version control",
            "triggers": ["git", "commit"],
            "priority": "medium",
        }
    )

    matcher = SkillMatcher(registry)

    # Match on keyword "debug"
    result = matcher.match(
        goal="Fix a Python bug using the debugger",
        task_description="",
    )
    assert len(result) >= 1
    names = [s["name"] for s in result]
    assert "debugging_with_pdb" in names

    # Match on keyword "git"
    result = matcher.match(goal="Commit my changes", task_description="")
    assert len(result) >= 1
    names = [s["name"] for s in result]
    assert "git_operations" in names


def test_skill_matcher_no_match():
    """When no triggers match, result should be empty."""
    registry = SkillRegistry()
    registry.register(
        {
            "name": "debugging_with_pdb",
            "description": "Debug Python with pdb",
            "triggers": ["debug", "pdb"],
            "priority": "high",
        }
    )

    matcher = SkillMatcher(registry)

    result = matcher.match(
        goal="Cook dinner",
        task_description="",
    )
    # Should be empty since neither tier 1 nor tier 3 will match (tier 3 requires API key)
    # Without a real API key, tier 3 (LLM fallback) will fail and return []
    assert len(result) == 0


# =========================================================================
# PostgresMemoryStore — no-op mode
# =========================================================================


@pytest.mark.asyncio
async def test_postgres_memory_store_noop():
    """Store operates in no-op mode without PG / asyncpg."""
    store = PostgresMemoryStore(dsn="postgresql://localhost:5432/nonexistent")
    # In no-op mode (asyncpg might or might not be installed)
    await store.connect()

    # Should not raise
    value = await store.get("project1", "some_key")
    assert value is None

    await store.set("project1", "some_key", {"hello": "world"})
    # Still no-op, nothing was stored
    value = await store.get("project1", "some_key")
    assert value is None

    all_items = await store.get_all("project1")
    assert all_items == {}

    await store.delete("project1", "some_key")
    # No error expected

    await store.disconnect()


# =========================================================================
# Engineered Prompt
# =========================================================================


def test_engineered_prompt_with_persona():
    """Verify persona is included in the rendered prompt."""
    result = render_system_prompt(
        assembled_context="=== INSTRUCTIONS ===\nBe careful.",
        persona="You are a helpful coding assistant.",
    )
    assert "persona" in result.lower() or "You are" in result
    assert "helpful coding assistant" in result
    assert "=== INSTRUCTIONS ===" in result


def test_engineered_prompt_without_persona():
    """Without a persona, the prompt uses a default identity."""
    result = render_system_prompt(
        assembled_context="=== INSTRUCTIONS ===\nDo the work.",
        persona=None,
    )
    assert "deepseek-v4-pro" in result
    assert "=== INSTRUCTIONS ===" in result


def test_engineered_prompt_empty_context():
    """With empty context and no persona, returns just the base identity."""
    result = render_system_prompt(assembled_context="", persona=None)
    assert "deepseek-v4-pro" in result
    assert result == (
        "You are an expert coding assistant powered by deepseek-v4-pro. "
        "Use the available tools to accomplish the goal."
    )


# =========================================================================
# Graph compilation with Phase 2 modules
# =========================================================================


def test_graph_compiles_phase2():
    """Verify the graph still compiles with Phase 2 modules integrated."""
    compiled = build_graph()
    assert compiled is not None

    nodes = set(compiled.get_graph().nodes)
    expected_nodes = {
        "__start__",
        "ingest_goal",
        "context_decider",
        "assemble_context",
        "execute_step_pro",
        "observe_result",
        "__end__",
    }
    assert expected_nodes.issubset(nodes), f"Missing nodes: {expected_nodes - nodes}"

    # Verify the graph edges are intact
    graph = compiled.get_graph()
    edges = {(e.source, e.target) for e in graph.edges}
    expected_edges = {
        ("__start__", "ingest_goal"),
        ("ingest_goal", "context_decider"),
        ("context_decider", "assemble_context"),
        ("assemble_context", "execute_step_pro"),
        ("execute_step_pro", "observe_result"),
        ("observe_result", "__end__"),
        ("observe_result", "execute_step_pro"),
    }
    for edge in expected_edges:
        assert edge in edges, f"Missing edge: {edge}"
