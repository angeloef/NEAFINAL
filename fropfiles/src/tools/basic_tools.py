"""
Basic file-system and shell tools for the Frop harness.

Each tool is decorated with ``@tool`` from ``langchain.tools`` and
registered in the ``tools`` and ``tools_by_name`` module-level exports
for easy binding to LangGraph / LangChain model instances.
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path
from typing import Optional

from langchain.tools import tool


@tool
def read_file_tool(path: str, max_chars: int = 2000) -> str:
    """Read the contents of a text file and return the first *max_chars* characters.

    Parameters
    ----------
    path : str
        Absolute or relative path to the file to read.
    max_chars : int, optional
        Maximum number of characters to return (default 2000).

    Returns
    -------
    str
        The file contents, truncated to *max_chars* characters,
        or an error message if the file cannot be read.
    """
    try:
        resolved = Path(path).expanduser().resolve()
        if not resolved.exists():
            return f"Error: file not found — {resolved}"
        if not resolved.is_file():
            return f"Error: path is not a file — {resolved}"
        content = resolved.read_text(encoding="utf-8")
        if len(content) > max_chars:
            content = content[:max_chars] + f"\n... [truncated at {max_chars} chars]"
        return content
    except Exception as exc:
        return f"Error reading file '{path}': {exc}"


@tool
def search_files_tool(pattern: str, path: str = ".") -> str:
    """Search for *pattern* in files under *path* using ``grep``.

    Parameters
    ----------
    pattern : str
        Regular expression or fixed string to search for.
    path : str, optional
        Directory tree to search (default: current working directory).

    Returns
    -------
    str
        Matching lines prefixed with file paths, or a "no matches"
        message.  On error returns the stderr from ``grep``.
    """
    try:
        result = subprocess.run(
            ["grep", "--recursive", "--line-number", "--color=never", pattern, path],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            output = result.stdout.strip()
            if not output:
                return f"No matches for pattern '{pattern}' in {path}."
            return output
        elif result.returncode == 1:
            return f"No matches for pattern '{pattern}' in {path}."
        else:
            return f"grep error (code {result.returncode}): {result.stderr.strip()}"
    except subprocess.TimeoutExpired:
        return f"Search timed out after 30s for pattern '{pattern}' in {path}."
    except FileNotFoundError:
        return "Error: 'grep' is not available on this system."
    except Exception as exc:
        return f"Error searching files: {exc}"


@tool
def run_command_tool(command: str, timeout: int = 30) -> str:
    """Run a shell command and return its combined stdout+stderr.

    Parameters
    ----------
    command : str
        Shell command to execute.
    timeout : int, optional
        Maximum execution time in seconds (default 30).

    Returns
    -------
    str
        The combined stdout and stderr of the command, or an error
        description if the command fails or times out.
    """
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        output_parts = []
        if result.stdout:
            output_parts.append(result.stdout.strip())
        if result.stderr:
            output_parts.append(f"[stderr]\n{result.stderr.strip()}")
        body = "\n".join(output_parts) if output_parts else "(no output)"
        return f"Exit code: {result.returncode}\n{body}"
    except subprocess.TimeoutExpired:
        return f"Command timed out after {timeout}s: {command}"
    except Exception as exc:
        return f"Error running command: {exc}"


@tool
def write_file_tool(path: str, content: str) -> str:
    """Write *content* to the file at *path*, creating parent directories as needed.

    Parameters
    ----------
    path : str
        Absolute or relative path of the file to write.
    content : str
        Text content to write to the file.

    Returns
    -------
    str
        Confirmation message including the resolved path and byte count,
        or an error message if the write fails.
    """
    try:
        resolved = Path(path).expanduser().resolve()
        resolved.parent.mkdir(parents=True, exist_ok=True)
        byte_count = resolved.write_text(content, encoding="utf-8")
        return f"Wrote {byte_count} bytes to {resolved}"
    except Exception as exc:
        return f"Error writing file '{path}': {exc}"


# ── Exports ──────────────────────────────────────────────────────────

tools = [read_file_tool, search_files_tool, run_command_tool, write_file_tool]
"""List of all tool functions for binding to a LangChain model."""

tools_by_name: dict[str, tool] = {t.name: t for t in tools}
"""Mapping from tool name → tool callable for fast lookup."""
