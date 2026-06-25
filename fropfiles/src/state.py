"""
Frop — Agent State Schemas (Phase 1)

All TypedDict / Pydantic state schemas for the LangGraph-based
personal coding harness. Based on the architecture defined in
langgraph_implementation_plan.md Section 4.1.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from langgraph.graph import add_messages
from pydantic import BaseModel, Field
from typing_extensions import Annotated, Literal, TypedDict


# ── Agent Goal ─────────────────────────────────────────────────────

class AgentGoal(TypedDict):
    """The mission/objective given to the agent."""

    description: str  # Natural language goal
    success_criteria: List[str]  # Explicit criteria for "done"
    constraints: List[str]  # Hard rules (e.g., "never modify DB schema")
    priority: Literal["low", "medium", "high"]
    project_id: str  # Which project this goal belongs to


# ── Task Plan ──────────────────────────────────────────────────────

class TaskStep(TypedDict):
    """A single atomic step in the plan."""

    id: str
    description: str
    assigned_model: Optional[str]  # "deepseek-v4-pro" or "deepseek-v4-flash"
    required_skills: List[str]  # Skills this step needs
    status: Literal["pending", "running", "done", "failed", "skipped"]
    result: Optional[str]
    error: Optional[str]


class TaskPlan(TypedDict):
    """Decomposed plan as a list of steps."""

    steps: List[TaskStep]
    status: Literal["draft", "approved", "in_progress", "complete", "failed"]


# ── Context ────────────────────────────────────────────────────────

class StaticContext(TypedDict):
    """Always-loaded context: system prompt, rules, persona."""

    system_instructions: str  # Core role definition
    rule_files: Dict[str, str]  # e.g., {"AGENTS.md": "...", "CLAUDE.md": "..."}
    persona: Optional[str]  # Agent personality if applicable
    global_constraints: List[str]  # Never-break rules


class DynamicContext(TypedDict):
    """On-demand context: skills, retrieved docs, session history."""

    active_skills: List[Dict[str, Any]]  # Currently loaded skills
    retrieved_documents: List[Dict[str, Any]]  # RAG results
    tool_results: List[Dict[str, Any]]  # Recent tool call outputs
    session_window: List[str]  # Recent messages (windowed)


class ContextPayload(TypedDict):
    """Assembled context for a single model call."""

    static: StaticContext
    dynamic: DynamicContext
    assembled_text: str  # The rendered prompt
    active_context_types: List[str]  # Which of the 6 types were selected


# ── Memory ─────────────────────────────────────────────────────────

class ShortTermMemory(TypedDict):
    """Within-session state: what just happened."""

    last_action: Optional[str]
    last_result: Optional[str]
    iteration_count: int


class LongTermMemory(TypedDict):
    """Cross-session state: project knowledge, learned patterns."""

    project_knowledge: Dict[str, str]  # Key-value persistent store
    behavioral_rules: List[str]  # Rules learned over time
    skill_usage_stats: Dict[str, int]  # Skill invocation counts
    checkpoints: List[Dict[str, Any]]  # Diff snapshots for change tracking


# ── Guardrails & Observability ─────────────────────────────────────

class GuardrailReport(TypedDict):
    """Output of guardrail checks."""

    passed: bool
    violations: List[Dict[str, Any]]  # [{rule, severity, detail}]
    auto_fix_applied: Optional[str]


class ObservabilityRecord(TypedDict):
    """Per-execution observability data."""

    trace_id: str
    model_calls: List[Dict[str, Any]]  # [{model, tokens_in, tokens_out, latency}]
    tool_calls: List[Dict[str, Any]]  # [{tool, args, result, duration}]
    trajectory: List[Dict[str, Any]]  # Full action sequence
    cost_estimate: float


# ── Master Agent State ─────────────────────────────────────────────

class AgentState(TypedDict):
    """Top-level state passed through the entire LangGraph."""

    # Goal & Plan
    goal: AgentGoal
    plan: TaskPlan

    # Context
    context: ContextPayload

    # Memory
    short_term: ShortTermMemory
    long_term: LongTermMemory

    # Execution
    current_step: Optional[str]  # ID of current task step
    messages: Annotated[List, add_messages]  # Conversation history
    intermediate_outputs: Annotated[List[Dict[str, Any]], "accumulated_results"]

    # Model Routing
    active_model: Optional[str]  # "deepseek-v4-pro" or "deepseek-v4-flash"
    model_route_decisions: List[Dict[str, Any]]  # Audit trail

    # Guardrails & Quality
    guardrail: GuardrailReport
    human_review_requests: Annotated[List[str], "accumulated_requests"]

    # Observability
    observability: ObservabilityRecord

    # Control Flow
    remaining_retries: int
    loop_count: int
    status: Literal["running", "awaiting_human", "completed", "failed"]


# ── Factory Helpers ────────────────────────────────────────────────

def default_agent_goal(description: str = "", project_id: str = "default") -> AgentGoal:
    """Create a default AgentGoal with sensible defaults."""
    return {
        "description": description,
        "success_criteria": [],
        "constraints": [],
        "priority": "medium",
        "project_id": project_id,
    }


def default_agent_state(description: str = "", project_id: str = "default") -> AgentState:
    """Create a default AgentState for bootstrapping the graph."""
    from uuid import uuid4

    return {
        "goal": default_agent_goal(description, project_id),
        "plan": {"steps": [], "status": "draft"},
        "context": {
            "static": {
                "system_instructions": "You are Frop, a personal coding assistant.",
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
            "active_context_types": ["instructions", "tools"],
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
            "trace_id": str(uuid4()),
            "model_calls": [],
            "tool_calls": [],
            "trajectory": [],
            "cost_estimate": 0.0,
        },
        "remaining_retries": 3,
        "loop_count": 0,
        "status": "running",
    }
