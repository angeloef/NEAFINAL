# Frop — Sandbox Docker Image
#
# Minimal Python 3.12 sandbox for executing tool calls in isolation.
# Pre-installs linting/formatting tools used by the harness.
# Build with: docker build -t code-executor:latest -f src/docker/Dockerfile .

FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    jq \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir \
        black \
        pyflakes \
        mypy

# Create working directory for project mounts
WORKDIR /mnt/project

# Default command
CMD ["/bin/bash"]
