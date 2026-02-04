"""Code Agent: generates modular C/C++ source (.h/.c separated) per module.
Must respect RAG context and MCP authorization.
"""
from __future__ import annotations

import json
from typing import Any

from ..base import AgentBase, AgentResult


class CodeAgent(AgentBase):
    def __init__(self, module_name: str):
        super().__init__(agent_id=f"code_agent:{module_name}")
        self.module_name = module_name

    def execute(self, context: Any, inputs: dict) -> AgentResult:
        """Generate modular code (header + source separate)."""
        # MCP authorization
        context.mcp.check_run(self.agent_id)
        context.mcp.check_write(self.agent_id, f"module_code:{self.module_name}")

        # RAG: Get context for this module type
        module_type = inputs.get("id", self.module_name)
        rag_ctx = context.rag.query(
            f"generate {module_type} module code",
            top_k=3,
            module_type=module_type
        )

        # Compose prompt with RAG
        prompt = context.prompt_loader.compose(
            "code_agent",
            constraints="No dynamic memory. Separate .h/.c. MISRA-compliant.",
            rag_context=rag_ctx,
            module=inputs
        )

        # Generate code (agent should return JSON with header/source)
        generated_raw = context.llm.generate(prompt)
        
        # Parse generated code (expect JSON or plain text with markers)
        header_code, source_code = self._extract_modular_code(generated_raw)
        
        # Persist as separate .h and .c files
        from core.artifacts import write_modular_code

        result = write_modular_code(
            context=context,
            agent_id=self.agent_id,
            module_id=self.module_name,
            header_code=header_code,
            source_code=source_code,
            metadata={
                "prompt_version": "v1",
                "rag_context_used": len(rag_ctx) > 0
            },
            prompt_version="v1"
        )

        return AgentResult(
            success=True,
            artifact_path=str(result["source"]),
            message=f"Module code generated: {result['header'].name}, {result['source'].name}",
            metadata={
                "header_file": str(result["header"]),
                "source_file": str(result["source"]),
                "metadata_file": str(result["metadata"]),
                "module_id": result["module_id"]
            }
        )

    @staticmethod
    def _extract_modular_code(generated_raw: str) -> tuple[str, str]:
        """
        Extract header and source code from LLM output.
        
        Expects one of:
        1. JSON: {"header": "...", "source": "..."}
        2. Marked sections: ###HEADER### ... ###SOURCE### ...
        3. Fallback: split at pragmatic boundary
        """
        try:
            # Try JSON parsing
            data = json.loads(generated_raw)
            header = data.get("header", "")
            source = data.get("source", "")
            if header and source:
                return header, source
        except (json.JSONDecodeError, ValueError):
            pass

        # Try marked sections
        if "###HEADER###" in generated_raw and "###SOURCE###" in generated_raw:
            parts = generated_raw.split("###HEADER###")
            if len(parts) > 1:
                header_part = parts[1].split("###SOURCE###")[0].strip()
                source_part = parts[1].split("###SOURCE###")[1].strip()
                return header_part, source_part

        # Fallback: split at #include or function definition
        lines = generated_raw.split("\n")
        header_end = 0
        for i, line in enumerate(lines):
            if line.startswith("int ") or line.startswith("void ") or \
               line.startswith("uint") or line.startswith("float "):
                header_end = i
                break

        if header_end > 0:
            header = "\n".join(lines[:header_end])
            source = "\n".join(lines[header_end:])
        else:
            # Last resort: assume first half is header
            mid = len(lines) // 2
            header = "\n".join(lines[:mid])
            source = "\n".join(lines[mid:])

        return header, source
