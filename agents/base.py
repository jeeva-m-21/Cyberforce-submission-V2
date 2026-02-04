"""Agent base classes and interfaces — agents are isolated and have explicit I/O."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class AgentResult:
    success: bool
    artifact_path: str | None = None
    message: str = ""
    metadata: Dict[str, Any] | None = None


class AgentBase:
    agent_id: str

    def __init__(self, agent_id: str):
        self.agent_id = agent_id

    def execute(self, context: Any, inputs: Dict[str, Any]) -> AgentResult:
        """Each agent implements execute and returns an AgentResult.

        `context` is an execution context object containing MCP, RAG, and other helpers.
        Agents MUST call MCP checks via the provided context before performing writes or reads.
        """
        raise NotImplementedError
