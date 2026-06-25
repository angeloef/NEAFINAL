"""
Frop core graph — LangGraph StateGraph for the personal coding harness.

Defines the six-node pipeline and a ``build_graph()`` factory
that returns a compiled ``StateGraph`` ready for invocation.

Flow
----
    START
      │
      ▼
  ingest_goal          Parse and validate the user goal (flash)
      │
      ▼
  context_decider      LLM selects relevant context types (flash)
      │
      ▼
  assemble_context     Deterministic context assembly
      │
      ▼
  execute_step_pro     Execute step via deepseek-v4-pro (with tools)
      │
      ▼
  observe_result       Evaluate step output (flash)
      │
      ▼
  decide_continue      Conditional edge → "execute_step_pro" (continue) or END
      │
      ▼
      END
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Literal, Optional

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph

from src.state import AgentState
from src.tools.basic_tools import tools as available_tools
from src.context.context_decider import context_decider as context_decider_node
from src.context.context_builder import ContextBuilder
from src.context.static_context import StaticContextResolver
from src.context.dynamic_context import DynamicContextManager
from src.context.engineered_prompt import render_system_prompt

# ── Model initialisation ─────────────────────────────────────────────

load_dotenv("/home/angelo/.hermes/.env")
DEEPSEEK_API_KEY: str = os.environ["DEEPSEEK_API_KEY"]
DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"

pro_model = ChatOpenAI(
    model="deepseek-v4-pro",
    base_url=DEEPSEEK_BASE_URL,
    api_key=DEEPSEEK_API_KEY,
    temperature=0,
)

flash_model = ChatOpenAI(
    model="deepseek-v4-flash",
    base_url=DEEPSEEK_BASE_URL,
    api_key=DEEPSEEK_API_KEY,
    temperature=0,
)

# Pre-bind tools to the *pro* model — this is the one that acts.
model_with_tools = pro_model.bind_tools(available_tools)


# ── Default state factory ────────────────────────────────────────────

def default_state(
    goal_description: str,
    project_id: str = "default",
) -> AgentState:
    """Return a minimal ``AgentState`` with sensible defaults.

    Parameters
    ----------
    goal_description : str
        Natural-language goal for the agent.
    project_id : str, optional
        Project identifier (default ``"default"``).

    Returns
    -------
    AgentState
    """
    return {
        "goal": {
            "description": goal_description,
            "success_criteria": [],
            "constraints": [],
            "priority": "medium",
            "project_id": project_id,
        },
        "plan": {
            "steps": [],
            "status": "draft",
        },
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
        "short_term": {
            "last_action": None,
            "last_result": None,
            "iteration_count": 0,
        },
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
        "guardrail": {
            "passed": True,
            "violations": [],
            "auto_fix_applied": None,
        },
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


# ── Node implementations ─────────────────────────────────────────────


def ingest_goal(state: AgentState) -> Dict[str, Any]:
    """Parse and validate the user goal using the flash model.

    Reads ``state["goal"]["description"]``, sends it to
    ``deepseek-v4-flash`` for validation and refinement, then sets
    ``status`` to ``"running"``.

    Parameters
    ----------
    state : AgentState
        Current graph state containing the goal description.

    Returns
    -------
    Dict[str, Any]
        Partial state update with refined goal, status, and messages.
    """
    goal_desc = state["goal"]["description"]

    system_msg = SystemMessage(
        content=(
            "You are a goal validator. Given a user's goal description, "
            "assess whether it is clear, actionable, and specific enough "
            "for a coding agent to execute. "
            "Respond with a JSON object with keys:\n"
            "  - valid: bool\n"
            "  - refined_description: str (the goal, clarified if needed)\n"
            "  - success_criteria: list[str]\n"
            "  - constraints: list[str]"
        )
    )
    human_msg = HumanMessage(content=f"Goal: {goal_desc}")

    response = flash_model.invoke([system_msg, human_msg])

    new_messages = list(state.get("messages", [])) + [human_msg, response]

    # Attempt to parse JSON from the model output; fall back gracefully.
    try:
        parsed = json.loads(response.content.strip())
        refined_goal = parsed.get("refined_description", goal_desc)
        success_criteria = parsed.get("success_criteria", [])
        constraints = parsed.get("constraints", [])
        valid = parsed.get("valid", True)
    except (json.JSONDecodeError, AttributeError):
        refined_goal = goal_desc
        success_criteria = []
        constraints = []
        valid = True

    return {
        "goal": {
            **state["goal"],
            "description": refined_goal,
            "success_criteria": success_criteria,
            "constraints": constraints,
        },
        "status": "running" if valid else "failed",
        "messages": new_messages,
        "observability": {
            **state.get("observability", {}),
            "model_calls": state.get("observability", {}).get("model_calls", [])
            + [{"model": "deepseek-v4-flash", "node": "ingest_goal"}],
        },
    }


def context_decider(state: AgentState) -> Dict[str, Any]:
    """LLM decides which of the six context types are needed for this step.

    Uses ``deepseek-v4-flash`` to select from:
    ``instructions``, ``knowledge``, ``memory``, ``examples``,
    ``tools``, ``guardrails``.

    Parameters
    ----------
    state : AgentState
        Current graph state with goal description.

    Returns
    -------
    Dict[str, Any]
        Partial state update with ``active_context_types`` set.
    """
    return context_decider_node(state)


def assemble_context(state: AgentState) -> Dict[str, Any]:
    """Deterministic node that assembles static + dynamic context.

    Only includes context types selected by ``context_decider``.
    Produces the ``assembled_text`` field used in the next LLM call.

    Parameters
    ----------
    state : AgentState
        Current graph state with active context types.

    Returns
    -------
    Dict[str, Any]
        Partial state update with ``assembled_text`` populated.
    """
    builder = ContextBuilder()
    assembled = builder.build(
        static=state["context"]["static"],
        dynamic=state["context"]["dynamic"],
        active_types=state["context"]["active_context_types"],
        available_tools=available_tools,
    )

    return {
        "context": {
            **state["context"],
            "assembled_text": assembled,
        }
    }


def execute_step_pro(state: AgentState) -> Dict[str, Any]:
    """Execute the current step using ``deepseek-v4-pro`` with tools bound.

    Assembles a system message from the assembled context, a human
    message from the current goal and step, then invokes the model
    which may produce tool calls.

    Parameters
    ----------
    state : AgentState
        Current graph state with assembled context.

    Returns
    -------
    Dict[str, Any]
        Partial state update with new messages and observations.
    """
    goal_desc = state["goal"]["description"]
    assembled_text = state["context"].get("assembled_text", "")
    current_step = state.get("current_step")
    step_desc = ""
    if current_step and state["plan"]["steps"]:
        for s in state["plan"]["steps"]:
            if s["id"] == current_step:
                step_desc = s["description"]
                break

    persona = state["context"]["static"].get("persona")
    system_prompt = render_system_prompt(
        assembled_context=assembled_text,
        persona=persona,
    )
    user_prompt = (
        f"Goal: {goal_desc}\n"
        f"Current step: {current_step or 'N/A'} — {step_desc}\n\n"
        "Proceed with the task."
    )

    system_msg = SystemMessage(content=system_prompt)

    # Window of last 10 messages for context
    existing = list(state.get("messages", []))
    messages = [system_msg] + existing[-10:]
    messages.append(HumanMessage(content=user_prompt))

    response = model_with_tools.invoke(messages)

    new_messages = messages + [response]

    short_term = {
        "last_action": "execute_step_pro",
        "last_result": response.content if response.content else "(tool calls)",
        "iteration_count": state["short_term"]["iteration_count"] + 1,
    }

    intermediate_outputs = list(state.get("intermediate_outputs", []))
    if response.content:
        intermediate_outputs.append(
            {"step": current_step, "type": "text", "content": response.content}
        )

    return {
        "messages": new_messages,
        "short_term": short_term,
        "intermediate_outputs": intermediate_outputs,
        "observability": {
            **state.get("observability", {}),
            "model_calls": state.get("observability", {}).get("model_calls", [])
            + [{"model": "deepseek-v4-pro", "node": "execute_step_pro"}],
        },
    }


def observe_result(state: AgentState) -> Dict[str, Any]:
    """Evaluate the step output using ``deepseek-v4-flash``.

    Updates the step's status in the plan based on LLM evaluation.

    Parameters
    ----------
    state : AgentState
        Current graph state with step execution results.

    Returns
    -------
    Dict[str, Any]
        Partial state update with evaluated step status.
    """
    goal_desc = state["goal"]["description"]
    last_result = state["short_term"].get("last_result") or ""
    success_criteria = state["goal"].get("success_criteria", [])

    system_msg = SystemMessage(
        content=(
            "You are an output evaluator. Given a goal, success criteria, "
            "and the agent's output, determine whether the step was "
            "successful. Respond with a JSON object:\n"
            "  {\n"
            '    "status": "done" | "failed" | "partial",\n'
            '    "reason": "<brief explanation>"\n'
            "  }"
        )
    )
    human_msg = HumanMessage(
        content=(
            f"Goal: {goal_desc}\n"
            f"Success criteria: {success_criteria}\n"
            f"Output:\n{last_result[:2000]}"
        )
    )

    response = flash_model.invoke([system_msg, human_msg])

    try:
        parsed = json.loads(response.content.strip())
        step_status = parsed.get("status", "done")
        reason = parsed.get("reason", "")
    except (json.JSONDecodeError, AttributeError):
        step_status = "done"
        reason = "Could not parse evaluation"

    # Update current step status in plan
    updated_steps = list(state["plan"]["steps"])
    current_step = state.get("current_step")
    if current_step:
        for i, s in enumerate(updated_steps):
            if s["id"] == current_step:
                updated_steps[i] = {
                    **s,
                    "status": step_status,
                    "result": last_result[:500],
                    "error": reason if step_status == "failed" else s.get("error"),
                }
                break

    new_messages = list(state.get("messages", [])) + [human_msg, response]

    return {
        "plan": {
            **state["plan"],
            "steps": updated_steps,
        },
        "messages": new_messages,
        "loop_count": state["loop_count"] + 1,
        "observability": {
            **state.get("observability", {}),
            "model_calls": state.get("observability", {}).get("model_calls", [])
            + [{"model": "deepseek-v4-flash", "node": "observe_result"}],
        },
    }


def decide_continue(
    state: AgentState,
) -> Literal["execute_step_pro", "__end__"]:
    """Conditional edge: decide whether to continue, retry, or finish.

    Routing rules:
    - All steps done → END
    - Current step failed with retries left → ``"execute_step_pro"``
    - Current step failed with no retries → END
    - Otherwise → ``"execute_step_pro"`` (next step)

    Parameters
    ----------
    state : AgentState
        Current graph state with plan and step statuses.

    Returns
    -------
    Literal["execute_step_pro", "__end__"]
        The next node name or END.
    """
    remaining_retries = state["remaining_retries"]

    # Check if all steps are done
    all_done = all(
        s["status"] in ("done", "skipped") for s in state["plan"]["steps"]
    )
    if all_done:
        return END  # "__end__"

    # Check for failed current step — retry if budget remains
    current_step = state.get("current_step")
    if current_step:
        for s in state["plan"]["steps"]:
            if s["id"] == current_step and s["status"] == "failed":
                if remaining_retries > 0:
                    return "execute_step_pro"
                else:
                    return END

    # Default: continue to next step (or loop back for more work)
    return "execute_step_pro"


# ── Graph builder ────────────────────────────────────────────────────


def build_graph() -> StateGraph:
    """Build and compile the Frop harness ``StateGraph``.

    Nodes registered (in order):
    1. ``ingest_goal`` — validate goal via deepseek-v4-flash
    2. ``context_decider`` — select context types via deepseek-v4-flash
    3. ``assemble_context`` — deterministic assembly
    4. ``execute_step_pro`` — execute via deepseek-v4-pro with tools
    5. ``observe_result`` — evaluate output via deepseek-v4-flash

    Conditional routing from ``observe_result``:
    - ``"execute_step_pro"`` → continue to next step / retry
    - ``"__end__"`` → finish

    Returns
    -------
    StateGraph
        A compiled LangGraph state machine ready for ``.invoke()``
        or ``.stream()``.
    """
    builder = StateGraph(AgentState)

    # Register nodes
    builder.add_node("ingest_goal", ingest_goal)
    builder.add_node("context_decider", context_decider)
    builder.add_node("assemble_context", assemble_context)
    builder.add_node("execute_step_pro", execute_step_pro)
    builder.add_node("observe_result", observe_result)

    # Linear pipeline edges
    builder.add_edge(START, "ingest_goal")
    builder.add_edge("ingest_goal", "context_decider")
    builder.add_edge("context_decider", "assemble_context")
    builder.add_edge("assemble_context", "execute_step_pro")
    builder.add_edge("execute_step_pro", "observe_result")

    # Conditional routing from observe_result
    builder.add_conditional_edges(
        "observe_result",
        decide_continue,
        {
            "execute_step_pro": "execute_step_pro",
            END: END,
        },
    )

    return builder.compile()


def run_graph(
    goal_description: str,
    project_id: str = "default",
    config: Any = None,
) -> AgentState:
    """Run the Frop graph with a given goal.

    Convenience wrapper that builds the graph, creates default state,
    and invokes the graph.

    Parameters
    ----------
    goal_description : str
        Natural language goal for the agent.
    project_id : str, optional
        Project identifier (default ``"default"``).
    config : Any, optional
        Ignored in Phase 1; reserved for HarnessConfig in later phases.

    Returns
    -------
    AgentState
        The final state after graph execution completes.
    """
    compiled = build_graph()
    initial_state = default_state(goal_description, project_id)
    result = compiled.invoke(initial_state)
    return result
