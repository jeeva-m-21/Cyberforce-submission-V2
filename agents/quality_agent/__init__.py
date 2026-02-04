"""Quality Agent: runs static analysis and safety checks, produces quality report."""
from __future__ import annotations

from ..base import AgentBase, AgentResult


class QualityAgent(AgentBase):
    def __init__(self):
        super().__init__(agent_id="quality_agent")

    def execute(self, context: Any, inputs: dict) -> AgentResult:
        context.mcp.check_run(self.agent_id)
        context.mcp.check_read(self.agent_id, "module_code")
        context.mcp.check_read(self.agent_id, "tests")
        context.mcp.check_write(self.agent_id, "reports")

        rag_ctx = context.rag.query("quality and static analysis rules", top_k=3)
        prompt = context.prompt_loader.compose("quality_agent", constraints="Flag MISRA/CERT issues.", rag_context=rag_ctx, module=inputs)
        generated = context.llm.generate(prompt)
        from core.artifacts import write_artifact

        path = write_artifact(context, self.agent_id, "reports", generated, metadata={"prompt_version": "v1"}, module_id=None, prompt_version="v1")
        return AgentResult(success=True, artifact_path=str(path), message="quality report generated")
