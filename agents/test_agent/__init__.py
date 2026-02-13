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

        # Extract MCU and board info
        target_mcu = context.target_mcu if hasattr(context, 'target_mcu') else inputs.get("target_mcu", "Unknown")
        modules = context.modules if hasattr(context, 'modules') else inputs.get("modules", [])

        rag_ctx = context.rag.query("unit test patterns", top_k=3)
        prompt = context.prompt_loader.compose(
            "test_agent",
            constraints="Deterministic tests only. Generate both test code and test case tables.",
            rag_context=rag_ctx,
            module=inputs,
            mcu=target_mcu,
            modules=modules
        )
        generated = context.llm.generate(prompt)
        
        # Parse dual output format: test code and test cases
        test_code, test_cases = self._extract_test_artifacts(generated)
        
        from core.artifacts import write_artifact

        # Write test code (.c file)
        code_path = write_artifact(
            context,
            self.agent_id,
            "tests",
            test_code,
            metadata={"prompt_version": "v1", "artifact_type": "test_code"},
            module_id=inputs.get("id"),
            prompt_version="v1",
            extension="c"
        )
        
        # Write test cases (.md file)
        cases_path = write_artifact(
            context,
            self.agent_id,
            "tests",
            test_cases,
            metadata={"prompt_version": "v1", "artifact_type": "test_cases"},
            module_id=inputs.get("id"),
            prompt_version="v1",
            extension="md"
        )
        
        return AgentResult(
            success=True,
            artifact_path=str(code_path),
            message=f"tests generated: {code_path.name}, {cases_path.name}",
            metadata={"test_code": str(code_path), "test_cases": str(cases_path)}
        )

    @staticmethod
    def _extract_test_artifacts(generated: str) -> tuple[str, str]:
        """Extract test code and test cases from LLM output."""
        test_code = ""
        test_cases = ""
        
        if "###TEST_CODE###" in generated and "###TEST_CASES###" in generated:
            parts = generated.split("###TEST_CODE###")
            if len(parts) > 1:
                code_part = parts[1].split("###TEST_CASES###")[0].strip()
                cases_part = parts[1].split("###TEST_CASES###")[1].strip() if "###TEST_CASES###" in parts[1] else ""
                test_code = code_part
                test_cases = cases_part
        else:
            # Fallback: treat entire output as test code
            test_code = generated
            test_cases = "# Test Cases\n\nNo structured test cases provided. See test code for details."
        
        return test_code, test_cases
