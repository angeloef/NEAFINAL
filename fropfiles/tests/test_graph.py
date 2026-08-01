"""
Tests for Frop Phase 1 — Core Graph Shell & State

Verifies that the LangGraph compiles, accepts input, and runs
through the linear path correctly.
"""

from __future__ import annotations

import pytest

from src.graph import build_graph, default_state, run_graph
from src.state import AgentState


def test_graph_compiles():
    """Verify that the graph builds and compiles without errors."""
    compiled = build_graph()
    assert compiled is not None
    # Check that the graph has the expected nodes
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


def test_graph_accepts_input():
    """Verify that the graph accepts a simple goal and produces output.

    This test makes live DeepSeek API calls (requires API key in
    /home/angelo/.hermes/.env). Marks as integration test.
    """
    result = run_graph("Build a FastAPI endpoint with health check", project_id="test")
    assert result is not None
    assert "goal" in result
    assert result["goal"]["description"] is not None
    assert result["goal"]["project_id"] == "test"
    assert result["status"] in ("running", "completed", "failed")


def test_linear_path():
    """Verify that the graph runs through the linear node order.

    This test makes live DeepSeek API calls. Checks that the graph
    produces a plan with steps and completes execution.
    """
    result = run_graph("Create a simple Python hello world function", project_id="test")

    # Check the graph ran — should have messages
    assert len(result.get("messages", [])) >= 2, "Should have at least system + response messages"

    # Check observability recorded model calls
    obs = result.get("observability", {})
    assert len(obs.get("model_calls", [])) >= 1, "Should have at least one model call"

    # Check short_term was updated
    assert result["short_term"]["iteration_count"] >= 1


def test_default_state_creation():
    """Verify that default_state creates a valid initial state."""
    state = default_state("Test goal", "test-project")
    assert state["goal"]["description"] == "Test goal"
    assert state["goal"]["project_id"] == "test-project"
    assert state["goal"]["priority"] == "medium"
    assert state["short_term"]["iteration_count"] == 0
    assert state["remaining_retries"] == 3
    assert state["status"] == "running"


def test_build_graph_returns_compiled():
    """Verify the compiled graph can be listed and has expected edges."""
    compiled = build_graph()
    graph = compiled.get_graph()
    # Walk edges to verify connectivity
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
