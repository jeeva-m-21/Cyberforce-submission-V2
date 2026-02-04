"""Build & OTA Agent: validates module code and logs build readiness.
DOES NOT compile or generate binaries (user compiles separately).
Generates build log and metadata only.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, List

from ..base import AgentBase, AgentResult


class BuildAgent(AgentBase):
    def __init__(self):
        super().__init__(agent_id="build_agent")

    def execute(self, context: Any, inputs: dict) -> AgentResult:
        context.mcp.check_run(self.agent_id)

        # Collect all module_code artifacts
        modules = inputs.get("modules", [])
        
        # Check read permissions
        for mod in modules:
            mid = mod.get("id")
            if mid:
                context.mcp.check_read(self.agent_id, f"module_code:{mid}")
        
        # Find all generated module files (.h and .c)
        module_dir = Path(context.run_output_dir) / "module_code"
        if not module_dir.exists():
            return AgentResult(
                success=True,
                artifact_path=None,
                message="No module_code artifacts found; build skipped."
            )

        # Collect all .h and .c files by module (pairs are optional)
        module_artifacts = {}
        for mod in modules:
            mod_id = mod.get("id")
            mod_subdir = module_dir / mod_id
            if mod_subdir.exists():
                header_file = mod_subdir / f"{mod_id}.h"
                source_file = mod_subdir / f"{mod_id}.c"
                entry = {}
                if header_file.exists():
                    entry["header"] = str(header_file)
                    entry["header_size"] = header_file.stat().st_size
                if source_file.exists():
                    entry["source"] = str(source_file)
                    entry["source_size"] = source_file.stat().st_size
                if entry:
                    module_artifacts[mod_id] = entry

        if not module_artifacts:
            return AgentResult(
                success=True,
                artifact_path=None,
                message="No module code artifacts found; build skipped."
            )

        # Generate build log (no actual compilation)
        build_log = self._generate_build_log(module_artifacts)
        
        # Write build log as JSON artifact
        from core.artifacts import write_json_artifact
        
        log_path = write_json_artifact(
            context=context,
            agent_id=self.agent_id,
            artifact_type="build_log",
            data=build_log,
            metadata={
                "modules_compiled": len(module_artifacts),
                "compile_skipped": True,
                "user_compilation_required": True
            },
            prompt_version="v1"
        )
        
        logging.info(f"Build log written: {log_path}")
        
        return AgentResult(
            success=True,
            artifact_path=str(log_path),
            message=f"Build ready: {len(module_artifacts)} module(s) generated. Compile using your toolchain.",
            metadata={
                "modules": module_artifacts,
                "instructions": "Compile with: gcc -I. *.c -o firmware.elf",
                "build_log": str(log_path)
            }
        )

    @staticmethod
    def _generate_build_log(module_artifacts: dict) -> dict:
        """Generate structured build readiness log."""
        return {
            "build_type": "source_only",
            "compilation_status": "skipped",
            "compilation_instructions": "User must compile. Example: gcc -I. *.c -o firmware.elf",
            "modules": module_artifacts,
            "total_modules": len(module_artifacts),
            "notes": [
                "Module code has been generated in source format (.h/.c)",
                "No binary compilation performed by CyberForge-26",
                "User is responsible for compilation with their toolchain",
                "Headers are ready for integration",
                "Verify module dependencies before compiling"
            ]
        }
