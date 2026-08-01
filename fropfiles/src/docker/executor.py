"""
Frop — Docker Sandbox Executor (Phase 1)

Wraps tool calls in Docker containers with resource limits and
isolated environment. Falls back to subprocess if Docker is
unavailable (useful for WSL without Docker Desktop).
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, Optional


class DockerExecutor:
    """Execute commands inside isolated Docker containers.

    Wraps tool calls in disposable Docker containers with configurable
    resource limits, project volume mounts, and network isolation.
    Falls back to subprocess execution if Docker is not available.

    Attributes:
        image: Docker image tag to use for containers.
        project_root: Absolute path to the project directory.
        _use_docker: Whether Docker is available on this system.
    """

    def __init__(
        self,
        image: str = "code-executor:latest",
        project_root: str = ".",
    ) -> None:
        """Initialize the DockerExecutor.

        Args:
            image: Docker image tag for sandbox containers.
            project_root: Path to the project root to mount.
        """
        self.image = image
        self.project_root = str(Path(project_root).expanduser().resolve())
        self._use_docker = self._check_docker_available()

    def _check_docker_available(self) -> bool:
        """Check if Docker is installed and the daemon is running.

        Returns:
            True if Docker is available, False otherwise.
        """
        try:
            result = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
            return False

    def execute(
        self,
        command: str,
        timeout: int = 60,
    ) -> Dict[str, Any]:
        """Execute a command in an isolated Docker container.

        Creates a temporary container, runs the command, captures
        output, and removes the container. Falls back to subprocess
        if Docker is unavailable.

        Args:
            command: Shell command to execute inside the container.
            timeout: Maximum execution time in seconds (default: 60).

        Returns:
            Dict with keys:
                - output (str): Combined stdout/stderr.
                - exit_code (int): Process exit code.
                - error (Optional[str]): Error message if execution failed.
        """
        if not self._use_docker:
            return self._execute_subprocess(command, timeout)

        return self._execute_docker(command, timeout)

    def _execute_docker(self, command: str, timeout: int) -> Dict[str, Any]:
        """Execute command inside a Docker container.

        Args:
            command: Shell command to execute.
            timeout: Max execution time in seconds.

        Returns:
            Dict with output, exit_code, and optional error.
        """
        container_name = f"frop-exec-{os.urandom(4).hex()}"

        try:
            # Build the docker run command with resource limits
            docker_cmd = [
                "docker", "run",
                "--rm",  # Auto-remove container after exit
                "--name", container_name,
                "--cpus", "2",
                "--memory", "4g",
                "--network", "none",  # No internet access
                "-v", f"{self.project_root}:/mnt/project:rw",
                "-w", "/mnt/project",
                self.image,
                "/bin/sh", "-c", command,
            ]

            result = subprocess.run(
                docker_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
            )

            output_parts = []
            if result.stdout:
                output_parts.append(result.stdout.rstrip())
            if result.stderr:
                output_parts.append(f"STDERR: {result.stderr.rstrip()}")

            return {
                "output": "\n".join(output_parts),
                "exit_code": result.returncode,
                "error": None,
            }

        except subprocess.TimeoutExpired:
            # Clean up timed-out container
            try:
                subprocess.run(
                    ["docker", "rm", "-f", container_name],
                    capture_output=True,
                    timeout=5,
                )
            except Exception:
                pass

            return {
                "output": "",
                "exit_code": -1,
                "error": f"Command timed out after {timeout} seconds",
            }

        except FileNotFoundError:
            # Docker binary not found, fall back to subprocess
            self._use_docker = False
            return self._execute_subprocess(command, timeout)

        except Exception as e:
            return {
                "output": "",
                "exit_code": -1,
                "error": f"Docker execution failed: {e}",
            }

    def _execute_subprocess(self, command: str, timeout: int) -> Dict[str, Any]:
        """Fallback: execute command directly via subprocess.

        Used when Docker is not available (e.g., WSL without Docker Desktop).

        Args:
            command: Shell command to execute.
            timeout: Max execution time in seconds.

        Returns:
            Dict with output, exit_code, and optional error.
        """
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.project_root,
            )

            output_parts = []
            if result.stdout:
                output_parts.append(result.stdout.rstrip())
            if result.stderr:
                output_parts.append(f"STDERR: {result.stderr.rstrip()}")

            return {
                "output": "\n".join(output_parts),
                "exit_code": result.returncode,
                "error": None,
            }

        except subprocess.TimeoutExpired:
            return {
                "output": "",
                "exit_code": -1,
                "error": f"Command timed out after {timeout} seconds",
            }

        except Exception as e:
            return {
                "output": "",
                "exit_code": -1,
                "error": f"Subprocess execution failed: {e}",
            }

    def build_image(self, dockerfile_path: str = "src/docker/Dockerfile") -> bool:
        """Build the Docker sandbox image from the Dockerfile.

        Args:
            dockerfile_path: Path to the Dockerfile (default: src/docker/Dockerfile).

        Returns:
            True if image was built successfully, False otherwise.
        """
        if not self._use_docker:
            print("Docker not available. Cannot build image.", file=sys.stderr)
            return False

        dockerfile = Path(dockerfile_path).expanduser().resolve()
        if not dockerfile.exists():
            print(f"Dockerfile not found: {dockerfile}", file=sys.stderr)
            return False

        try:
            result = subprocess.run(
                [
                    "docker", "build",
                    "-t", self.image,
                    "-f", str(dockerfile),
                    str(dockerfile.parent),
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )

            if result.returncode != 0:
                print(f"Image build failed:\n{result.stderr}", file=sys.stderr)
                return False

            print(f"Image {self.image} built successfully.")
            return True

        except Exception as e:
            print(f"Image build error: {e}", file=sys.stderr)
            return False
