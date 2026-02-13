"""Code Agent: generates MCU-specific firmware code.
Automatically determines file format based on target hardware.
"""
from __future__ import annotations

import json
import re
from typing import Any, Tuple

from ..base import AgentBase, AgentResult


class CodeAgent(AgentBase):
    def __init__(self, module_name: str):
        super().__init__(agent_id=f"code_agent:{module_name}")
        self.module_name = module_name
    
    @staticmethod
    def determine_mcu_format(mcu_name: str) -> dict:
        """
        Determine code format based on MCU/board name.
        
        Returns dict with:
        - is_single_file: bool (True for Arduino, False for modular)
        - extension: str (ino, cpp, c)
        - framework: str (arduino, hal, esp-idf, nordic, harmony)
        """
        mcu_lower = mcu_name.lower()
        
        # Arduino boards - single .ino file
        if any(x in mcu_lower for x in ["arduino", "uno", "mega", "nano", "atmega"]):
            return {
                "is_single_file": True,
                "extension": "ino",
                "framework": "arduino",
                "comment": "Arduino framework with setup()/loop()"
            }
        
        # ESP32 - can use Arduino framework or ESP-IDF
        elif "esp32" in mcu_lower or "esp8266" in mcu_lower:
            return {
                "is_single_file": True,
                "extension": "ino",  # Default to Arduino framework for ESP32
                "framework": "arduino-esp32",
                "comment": "ESP32 with Arduino framework"
            }
        
        # STM32 - modular HAL-based code
        elif "stm32" in mcu_lower or "stm" in mcu_lower:
            return {
                "is_single_file": False,
                "extension": "c",
                "framework": "hal",
                "comment": "STM32 HAL with modular .h/.c files"
            }
        
        # Nordic nRF52 - modular Nordic SDK
        elif "nrf52" in mcu_lower or "nrf51" in mcu_lower or "nordic" in mcu_lower:
            return {
                "is_single_file": False,
                "extension": "c",
                "framework": "nordic-sdk",
                "comment": "Nordic SDK with modular files"
            }
        
        # PIC32 - modular Harmony framework
        elif "pic32" in mcu_lower or "pic" in mcu_lower:
            return {
                "is_single_file": False,
                "extension": "c",
                "framework": "harmony",
                "comment": "PIC32 Harmony framework"
            }
        
        # Raspberry Pi Pico - could be Arduino or Pico SDK
        elif "pico" in mcu_lower or "rp2040" in mcu_lower:
            return {
                "is_single_file": True,
                "extension": "ino",
                "framework": "arduino-pico",
                "comment": "RP2040 with Arduino framework"
            }
        
        # Default: modular C code
        else:
            return {
                "is_single_file": False,
                "extension": "c",
                "framework": "generic",
                "comment": "Generic C with modular files"
            }

    def execute(self, context: Any, inputs: dict) -> AgentResult:
        """Generate MCU-specific code. Format determined by hardware target."""
        # MCP authorization
        context.mcp.check_run(self.agent_id)
        context.mcp.check_write(self.agent_id, f"module_code:{self.module_name}")

        # Extract MCU and board info
        target_mcu = context.target_mcu if hasattr(context, 'target_mcu') else inputs.get("target_mcu", "Unknown")
        optimization = context.optimization_goal if hasattr(context, 'optimization_goal') else inputs.get("optimization_goal", "balanced")
        all_modules = inputs.get("all_modules") or context.modules if hasattr(context, 'modules') else inputs.get("modules", [])
        project_name = inputs.get("project_name", "firmware")
        
        # DETERMINE FORMAT BASED ON HARDWARE
        mcu_format = self.determine_mcu_format(target_mcu)
        is_single_file = mcu_format["is_single_file"]
        extension = mcu_format["extension"]
        framework = mcu_format["framework"]

        # RAG: Get context for this module type
        module_type = inputs.get("type", self.module_name)
        rag_query = f"{framework} firmware structure" if is_single_file else f"generate {module_type} module code"
        rag_ctx = context.rag.query(rag_query, top_k=3, module_type=module_type)

        # Build hardware-specific constraints
        if is_single_file:
            format_instruction = f"Generate ONE {extension.upper()} file with ALL hardware modules integrated. Framework: {framework}."
        else:
            format_instruction = f"Generate modular .h/.c files. Framework: {framework}."
        
        # Compose prompt with hardware-specific instructions
        prompt = context.prompt_loader.compose(
            "code_agent",
            constraints=f"MCU: {target_mcu}. {format_instruction} MINIMAL comments. Return PURE CODE only.",
            rag_context=rag_ctx,
            module=inputs,
            mcu=target_mcu,
            board_specs=f"Target: {target_mcu}, Optimization: {optimization}, Framework: {framework}",
            optimization=optimization,
            modules=all_modules
        )

        # Generate code
        generated_raw = context.llm.generate(prompt)
        
        # Handle based on MCU format
        if is_single_file:
            # Single-file firmware (Arduino, ESP32-Arduino, etc.)
            header_code, source_code = self._extract_modular_code(generated_raw)
            code_content = source_code if source_code else (header_code if header_code else generated_raw)
            
            from core.artifacts import write_single_file_code
            
            result_path = write_single_file_code(
                context=context,
                agent_id=self.agent_id,
                project_name=project_name.replace(" ", "_"),
                code_content=code_content,
                metadata={
                    "prompt_version": "v1",
                    "target_mcu": target_mcu,
                    "framework": framework,
                    "modules": [m.get("id") for m in all_modules]
                },
                prompt_version="v1",
                extension=extension
            )
            
            return AgentResult(
                success=True,
                artifact_path=str(result_path),
                message=f"{framework.upper()} firmware generated: {result_path.name}",
                metadata={
                    "firmware_file": str(result_path),
                    "type": "single_file",
                    "extension": extension,
                    "framework": framework
                }
            )
        
        else:
            # Modular code (STM32, nRF52, PIC32, etc.)
            header_code, source_code = self._extract_modular_code(generated_raw)
            
            from core.artifacts import write_modular_code

            result = write_modular_code(
                context=context,
                agent_id=self.agent_id,
                module_id=self.module_name,
                header_code=header_code,
                source_code=source_code,
                metadata={
                    "prompt_version": "v1",
                    "framework": framework,
                    "rag_context_used": len(rag_ctx) > 0
                },
                prompt_version="v1"
            )

            return AgentResult(
                success=True,
                artifact_path=str(result["source"]),
                message=f"{framework.upper()} module code generated: {result['header'].name}, {result['source'].name}",
                metadata={
                    "header_file": str(result["header"]),
                    "source_file": str(result["source"]),
                    "metadata_file": str(result["metadata"]),
                    "module_id": result["module_id"],
                    "framework": framework
                }
            )

    @staticmethod
    def _extract_modular_code(generated_raw: str) -> tuple[str, str]:
        """
        Extract header and source code from LLM output.
        
        Handles:
        1. Markdown code blocks: ```c ... ``` or ```cpp ... ```
        2. JSON: {"header": "...", "source": "..."} or {"source": "..."}
        3. Marked sections: ###HEADER### ... ###SOURCE### ...
        4. Plain text fallback
        """
        import re
        
        # Step 1: Strip markdown code blocks
        content = generated_raw
        
        # Remove markdown code fences (```c ... ```)
        code_block_pattern = r'```(?:c|cpp|arduino|ino)?\s*\n([\s\S]*?)```'
        matches = re.findall(code_block_pattern, content, re.DOTALL)
        if matches:
            # Use the first/largest code block
            content = max(matches, key=len) if matches else content
        
        # Step 2: Try JSON parsing (handles {"source": "...", "header": "..."})
        try:
            # Remove backticks if still present
            json_content = content.strip('`').strip()
            data = json.loads(json_content)
            
            # Check for "source" key (Arduino single file)
            if "source" in data and "header" not in data:
                source = data["source"]
                # For single-file formats (Arduino), return empty header
                return "", source
            
            # Check for modular format
            header = data.get("header", "")
            source = data.get("source", "")
            if header or source:
                return header, source
        except (json.JSONDecodeError, ValueError):
            pass

        # Step 3: Try marked sections
        if "###HEADER###" in content and "###SOURCE###" in content:
            parts = content.split("###HEADER###")
            if len(parts) > 1:
                header_part = parts[1].split("###SOURCE###")[0].strip()
                source_part = parts[1].split("###SOURCE###")[1].strip() if "###SOURCE###" in parts[1] else ""
                return header_part, source_part
        
        # Step 4: Check if it's Arduino-style (no header needed)
        if "void setup(" in content or "void loop(" in content or ".ino" in generated_raw:
            # Single file format
            return "", content

        # Step 5: Fallback - try to split at function definitions
        lines = content.split("\n")
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
