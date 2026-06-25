"""
Frop — Harness Configuration (Phase 1)

Pydantic model for loading and validating the YAML harness
configuration. Based on langgraph_implementation_plan.md Section 11.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from pydantic import BaseModel, Field


class ProjectConfig(BaseModel):
    """Project-level configuration."""

    id: str = Field(default="default", description="Project identifier")
    root: str = Field(default=".", description="Project root directory")
    description: str = Field(default="", description="Project description")


class ModelConfig(BaseModel):
    """DeepSeek model configuration."""

    pro: str = Field(default="deepseek-v4-pro", description="Heavy reasoning model")
    flash: str = Field(default="deepseek-v4-flash", description="Fast/efficient model")


class ResourceLimits(BaseModel):
    """Resource limits for Docker sandbox."""

    cpu: int = Field(default=2, description="Max CPU cores")
    memory: str = Field(default="4g", description="Max memory")
    disk: str = Field(default="10g", description="Max disk")


class SandboxConfig(BaseModel):
    """Docker sandbox configuration."""

    type: str = Field(default="docker", description="Sandbox type")
    default_image: str = Field(default="code-executor:latest", description="Docker image")
    resource_limits: ResourceLimits = Field(default_factory=ResourceLimits)
    network: bool = Field(default=False, description="Allow network access")
    project_mount: str = Field(default="/mnt/project", description="Volume mount path")
    temp_dir: str = Field(default="/tmp/workdir", description="Working dir inside container")


class PersistenceConfig(BaseModel):
    """Persistence configuration (Phase 2+)."""

    type: str = Field(default="postgresql", description="Persistence backend")
    host: str = Field(default="localhost")
    port: int = Field(default=5432)
    database: str = Field(default="hermes_memory")
    user: str = Field(default="hermes")
    password: str = Field(default="")
    pool_size: int = Field(default=5)
    max_overflow: int = Field(default=10)


class SkillsConfig(BaseModel):
    """Skills subsystem configuration (Phase 2+)."""

    auto_load: bool = Field(default=True)
    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2")
    match_threshold: float = Field(default=0.75)


class ContextConfig(BaseModel):
    """Context engineering configuration."""

    always_include: List[str] = Field(default_factory=lambda: ["instructions", "tools"])
    optional_by_llm: List[str] = Field(default_factory=lambda: ["knowledge", "memory", "examples", "guardrails"])


class ConductorConfig(BaseModel):
    """Conductor mode configuration."""

    stream_output: bool = Field(default=True)
    human_interrupt_timeout: int = Field(default=300)
    auto_continue_on_timeout: bool = Field(default=False)


class ObservabilityConfig(BaseModel):
    """Observability configuration."""

    log_level: str = Field(default="info")
    trajectory_log: str = Field(default="logs/trajectory.jsonl")
    token_accounting: bool = Field(default=True)


class EvaluationConfig(BaseModel):
    """Evaluation configuration (Phase 5+)."""

    inline_eval: bool = Field(default=True)
    offline_suite: str = Field(default="eval_suite.yml")


class GuardrailsConfig(BaseModel):
    """Guardrail rules configuration."""

    rules: List[str] = Field(
        default_factory=lambda: [
            "no_hardcoded_secrets",
            "no_destructive_ops_without_confirm",
            "filesystem_boundaries",
            "docker_resource_limits",
            "output_validation",
            "no_network_egress",
            "no_unverified_dependencies",
        ]
    )


class HarnessConfig(BaseModel):
    """Top-level harness configuration.

    Loads from a YAML file or can be constructed programmatically.
    """

    project: ProjectConfig = Field(default_factory=ProjectConfig)
    models: ModelConfig = Field(default_factory=ModelConfig)
    persistence: PersistenceConfig = Field(default_factory=PersistenceConfig)
    sandbox: SandboxConfig = Field(default_factory=SandboxConfig)
    guardrails: GuardrailsConfig = Field(default_factory=GuardrailsConfig)
    skills: SkillsConfig = Field(default_factory=SkillsConfig)
    context: ContextConfig = Field(default_factory=ContextConfig)
    conductor: ConductorConfig = Field(default_factory=ConductorConfig)
    observability: ObservabilityConfig = Field(default_factory=ObservabilityConfig)
    evaluation: EvaluationConfig = Field(default_factory=EvaluationConfig)

    @classmethod
    def from_yaml(cls, path: str | Path) -> "HarnessConfig":
        """Load configuration from a YAML file.

        Args:
            path: Path to the YAML configuration file.

        Returns:
            HarnessConfig instance.
        """
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"Config file not found: {path}")

        with open(path) as f:
            data = yaml.safe_load(f)

        if data is None:
            raise ValueError(f"Empty or invalid YAML file: {path}")

        harness_data = data.get("harness", data)
        return cls(**harness_data)

    @classmethod
    def default(cls) -> "HarnessConfig":
        """Create a default HarnessConfig."""
        return cls()
