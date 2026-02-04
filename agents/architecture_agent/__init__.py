"""Architecture Agent: produces architecture artifacts (README, diagrams, module interfaces)."""
from __future__ import annotations

from ..base import AgentBase, AgentResult


class ArchitectureAgent(AgentBase):
    def __init__(self):
        super().__init__(agent_id="architecture_agent")

    def execute(self, context: Any, inputs: dict) -> AgentResult:
        # Validate MCP run permission and then write architecture artifact via MCP
        context.mcp.check_run(self.agent_id)
        context.mcp.check_write(self.agent_id, "architecture")

        # Gather RAG context
        rag_ctx = context.rag.query("architecture guidelines", top_k=3)
        prompt = context.prompt_loader.compose("architecture_agent", constraints="Follow MISRA-like rules.", rag_context=rag_ctx, module=inputs)
        # Ask the LLM (Gemini wrapper)
        generated = context.llm.generate(prompt)
        # Persist artifact
        from core.artifacts import write_artifact

        path = write_artifact(context, self.agent_id, "architecture", generated, metadata={"prompt_version": "v1"}, module_id=None, prompt_version="v1")
        return AgentResult(success=True, artifact_path=str(path), message="architecture generated")
