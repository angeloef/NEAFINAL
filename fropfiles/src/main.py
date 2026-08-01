"""
Frop — CLI Entry Point (Phase 1)

Interactive terminal using rich for the Frop personal coding harness.
Accepts a goal from command line args or enters interactive mode.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.table import Table

from src.graph import run_graph


# ── Constants ──────────────────────────────────────────────────────

DEFAULT_ENV_PATH = Path.home() / ".hermes" / ".env"
DEEPSEEK_API_BASE = "https://api.deepseek.com"


# ── Console ────────────────────────────────────────────────────────

console = Console()


# ── CLI Parsing ────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    """Parse command-line arguments.

    Returns:
        Parsed arguments namespace.
    """
    parser = argparse.ArgumentParser(
        description="Frop — Personal Coding Harness (LangGraph + DeepSeek)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python src/main.py \"Build a FastAPI endpoint\"\n"
            "  python src/main.py --project my-api \"Add unit tests\"\n"
            "  python src/main.py --interactive\n"
        ),
    )

    parser.add_argument(
        "goal",
        nargs="?",
        type=str,
        default=None,
        help="Goal description for the coding agent",
    )

    parser.add_argument(
        "-p", "--project",
        type=str,
        default="default",
        help="Project ID for memory partitioning (default: default)",
    )

    parser.add_argument(
        "-i", "--interactive",
        action="store_true",
        help="Start in interactive mode (no goal argument needed)",
    )

    parser.add_argument(
        "--env-file",
        type=str,
        default=str(DEFAULT_ENV_PATH),
        help=f"Path to .env file (default: {DEFAULT_ENV_PATH})",
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show detailed execution output",
    )

    return parser.parse_args()


# ── Environment Setup ──────────────────────────────────────────────

def load_environment(env_path: str) -> bool:
    """Load environment variables from .env file.

    Args:
        env_path: Path to the .env file.

    Returns:
        True if environment was loaded successfully.
    """
    path = Path(env_path).expanduser().resolve()

    if path.exists():
        load_dotenv(path)
        console.print(f"[dim]Loaded environment from: {path}[/dim]")
        return True
    else:
        console.print(
            f"[yellow]Warning: .env file not found at {path}[/yellow]\n"
            f"Create it with: echo 'DEEPSEEK_API_KEY=your-key-here' > {path}"
        )
        return False


def check_api_key() -> str | None:
    """Check that DEEPSEEK_API_KEY is set.

    Returns:
        The API key if set, None otherwise.
    """
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        console.print(
            "[red]Error: DEEPSEEK_API_KEY not found in environment[/red]\n"
            "Make sure your .env file contains: DEEPSEEK_API_KEY=sk-...",
        )
        return None
    return api_key


# ── Display Helpers ────────────────────────────────────────────────

def show_banner() -> None:
    """Display the Frop banner."""
    banner = """
    ╔══════════════════════════════════════════╗
    ║          Frop — Coding Harness           ║
    ║     LangGraph + DeepSeek · Phase 1       ║
    ╚══════════════════════════════════════════╝
    """
    console.print(Panel(banner, style="bold cyan"))


def show_result(state: dict) -> None:
    """Pretty-print the execution results.

    Args:
        state: Final AgentState from graph execution.
    """
    console.print("\n[bold green]✅ Execution Complete[/bold green]\n")

    # Goal summary
    goal = state.get("goal", {})
    console.print(Panel(
        f"[bold]Goal:[/bold] {goal.get('description', 'N/A')}\n"
        f"[bold]Project:[/bold] {goal.get('project_id', 'N/A')}\n"
        f"[bold]Priority:[/bold] {goal.get('priority', 'N/A')}",
        title="Goal",
        border_style="blue",
    ))

    # Plan summary
    plan = state.get("plan", {})
    steps = plan.get("steps", [])

    if steps:
        table = Table(title="Execution Steps")
        table.add_column("Step", style="cyan")
        table.add_column("Status", style="green")
        table.add_column("Result", style="white")

        for step in steps:
            status_style = {
                "done": "green",
                "failed": "red",
                "running": "yellow",
                "pending": "dim",
            }.get(step["status"], "white")
            result_preview = (step.get("result") or "")[:60]
            if len(result_preview) == 60:
                result_preview += "..."
            table.add_row(
                step["id"],
                f"[{status_style}]{step['status']}[/{status_style}]",
                result_preview or "—",
            )

        console.print(table)

    console.print(f"\nPlan status: {plan.get('status', 'N/A')}")

    # Short-term memory summary
    stm = state.get("short_term", {})
    console.print(f"\n[dim]Iterations: {stm.get('iteration_count', 0)}[/dim]")

    # Context summary
    ctx = state.get("context", {})
    console.print(f"\n[dim]Context types used: {', '.join(ctx.get('active_context_types', []))}[/dim]")

    # Final status
    status = state.get("status", "N/A")
    status_color = {
        "completed": "green",
        "failed": "red",
        "running": "yellow",
        "awaiting_human": "yellow",
    }.get(status, "white")
    console.print(f"\n[bold {status_color}]Final status: {status}[/bold {status_color}]")


def show_state(state: dict) -> None:
    """Show full state dump for verbose mode.

    Args:
        state: Final AgentState.
    """
    import json

    # Convert non-serializable items
    serializable = {}
    for key, value in state.items():
        if hasattr(value, "content"):
            serializable[key] = str(value)
        elif hasattr(value, "__dict__"):
            serializable[key] = str(value)
        else:
            try:
                json.dumps({key: value})
                serializable[key] = value
            except (TypeError, ValueError):
                serializable[key] = str(value)

    console.print(Panel(
        Syntax(
            json.dumps(serializable, indent=2, default=str),
            "json",
            theme="monokai",
        ),
        title="Full State",
        border_style="dim",
    ))


# ── Interactive Mode ───────────────────────────────────────────────

def interactive_loop(project_id: str, verbose: bool) -> None:
    """Run the interactive REPL-like loop.

    Args:
        project_id: Project ID for memory partitioning.
        verbose: Whether to show full state dumps.
    """
    console.print("[bold cyan]Interactive mode[/bold cyan]")
    console.print("Type your goal, or 'quit' to exit.\n")

    while True:
        try:
            goal = console.input("[bold green]>> [/bold green]").strip()
        except (EOFError, KeyboardInterrupt):
            console.print("\n[yellow]Goodbye![/yellow]")
            break

        if not goal:
            continue

        if goal.lower() in ("quit", "exit", "q"):
            console.print("[yellow]Goodbye![/yellow]")
            break

        console.print(f"\n[dim]Running: {goal}[/dim]\n")

        try:
            result = run_graph(goal, project_id=project_id)
            show_result(result)

            if verbose:
                show_state(result)

            console.print("\n" + "─" * 50 + "\n")

        except Exception as e:
            console.print(f"\n[red]Error: {e}[/red]")
            if verbose:
                import traceback
                console.print(traceback.format_exc())


# ── Main ───────────────────────────────────────────────────────────

def main() -> None:
    """Main entry point for the Frop CLI."""
    args = parse_args()

    show_banner()

    # Load environment
    load_environment(args.env_file)

    # Check API key (warn but don't block for Phase 1)
    check_api_key()

    # Determine mode
    is_interactive = args.interactive or args.goal is None

    if is_interactive and args.goal is None:
        interactive_loop(args.project, args.verbose)
    elif args.goal:
        console.print(f"[dim]Goal: {args.goal}[/dim]\n")
        try:
            result = run_graph(args.goal, project_id=args.project)
            show_result(result)

            if args.verbose:
                show_state(result)

        except Exception as e:
            console.print(f"\n[red]Error during execution:[/red] {e}")
            if args.verbose:
                import traceback
                console.print(traceback.format_exc())
            sys.exit(1)
    else:
        interactive_loop(args.project, args.verbose)


if __name__ == "__main__":
    main()
