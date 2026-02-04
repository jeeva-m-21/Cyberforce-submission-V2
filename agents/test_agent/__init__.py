"""Test Agent: produces unit tests for generated modules and enforces test coverage rules."""
from __future__ import annotations

from ..base import AgentBase, AgentResult


class TestAgent(AgentBase):
    def __init__(self):
        super().__init__(agent_id="test_agent")

    def execute(self, context: Any, inputs: dict) -> AgentResult:
        context.mcp.check_run(self.agent_id)
        # Ensure read access is scoped to the specific module
        module_id = inputs.get("id")
        if module_id:
            context.mcp.check_read(self.agent_id, f"module_code:{module_id}")
        else:
            context.mcp.check_read(self.agent_id, "module_code")
        context.mcp.check_write(self.agent_id, "tests")

        rag_ctx = context.rag.query("unit test patterns", top_k=3)
        prompt = context.prompt_loader.compose("test_agent", constraints="Deterministic tests only.", rag_context=rag_ctx, module=inputs)
        generated = context.llm.generate(prompt)
        from core.artifacts import write_artifact

        path = write_artifact(context, self.agent_id, "tests", generated, metadata={"prompt_version": "v1"}, module_id=inputs.get("id"), prompt_version="v1")
        return AgentResult(success=True, artifact_path=str(path), message="tests generated")
