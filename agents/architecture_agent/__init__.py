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

        # Extract MCU and project info from inputs
        target_mcu = inputs.get("target_mcu", "Unknown")
        optimization = inputs.get("optimization_goal", "balanced")
        modules = inputs.get("modules", [])

        # Gather RAG context
        rag_ctx = context.rag.query("architecture guidelines", top_k=3)
        prompt = context.prompt_loader.compose(
            "architecture_agent",
            constraints="Follow MISRA-like rules. Output must be in Markdown format.",
            rag_context=rag_ctx,
            module=inputs,
            mcu=target_mcu,
            board_specs=f"Target: {target_mcu}, Optimization: {optimization}",
            optimization=optimization,
            modules=modules
        )
        # Ask the LLM (Gemini wrapper)
        generated = context.llm.generate(prompt)
        # Persist artifact as .md file
        from core.artifacts import write_artifact

        path = write_artifact(
            context,
            self.agent_id,
            "architecture",
            generated,
            metadata={"prompt_version": "v1", "mcu": target_mcu},
            module_id=None,
            prompt_version="v1",
            extension="md"  # Use markdown extension
        )
        return AgentResult(success=True, artifact_path=str(path), message="architecture generated")
