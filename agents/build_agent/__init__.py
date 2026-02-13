"""Build & OTA Agent: validates module code, compiles C code, and runs unit tests.
Generates comprehensive build log with compilation status and test results.
"""
from __future__ import annotations

import json
import logging
import subprocess
from pathlib import Path
from typing import Any, List, Dict, Tuple, Optional
import platform
from datetime import datetime

from ..base import AgentBase, AgentResult


class BuildAgent(AgentBase):
    def __init__(self):
        super().__init__(agent_id="build_agent")

    def execute(self, context: Any, inputs: dict) -> AgentResult:
        context.mcp.check_run(self.agent_id)

        # Extract MCU target from context
        target_mcu = context.target_mcu if hasattr(context, 'target_mcu') else inputs.get("target_mcu", "Unknown")

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

        # Attempt C code compilation and testing
        compiler = self._find_compiler()
        build_results = self._compile_modules(compiler, module_artifacts, context.run_output_dir) if compiler else None
        test_results = self._run_tests(context.run_output_dir, module_artifacts, compiler)
        
        # Generate comprehensive build log
        build_log = self._generate_build_log(module_artifacts, build_results, test_results)
        
        # Write build log as JSON artifact
        from core.artifacts import write_json_artifact
        
        log_path = write_json_artifact(
            context=context,
            agent_id=self.agent_id,
            artifact_type="build_log",
            data=build_log,
            metadata={
                "modules_processed": len(module_artifacts),
                "compilation_attempted": compiler is not None,
                "compilation_status": build_results.get("status") if build_results else "no_compiler",
                "tests_executed": test_results is not None,
            },
            prompt_version="v1"
        )
        
        logging.info(f"Build log written: {log_path}")
        
        success = build_results is None or build_results.get("status") in ["success", "partial_success"]
        message = f"Build completed: {len(module_artifacts)} module(s) processed"
        if build_results and build_results.get("errors"):
            message += f" ({len(build_results['errors'])} error(s))"
        if test_results and not test_results.get("all_passed", True):
            message += " - Some tests failed"
        
        return AgentResult(
            success=success,
            artifact_path=str(log_path),
            message=message,
            metadata={
                "modules": module_artifacts,
                "compilation": build_results,
                "tests": test_results,
                "build_log": str(log_path)
            }
        )

    @staticmethod
    def _generate_build_log(module_artifacts: dict, build_results: Dict[str, Any] | None, test_results: Dict[str, Any] | None) -> dict:
        """Generate comprehensive build log with compilation and test results."""
        return {
            "timestamp": datetime.now().isoformat(),
            "build_type": "c_compilation_with_tests" if build_results else "source_only",
            "compilation_status": build_results.get("status") if build_results else "skipped",
            "compiler": build_results.get("compiler") if build_results else "not_available",
            "modules_compiled": len([m for m in build_results.get("modules", {}).values() if m.get("status") == "success"]) if build_results else 0,
            "total_modules": len(module_artifacts),
            "modules": module_artifacts,
            "compilation_details": build_results if build_results else {"status": "skipped", "reason": "no_compiler_found"},
            "unit_tests": test_results if test_results else {"status": "not_executed", "reason": "no_test_files_found"},
            "notes": [
                "C code compilation performed with strict flags (-Wall -Wextra -std=c99)" if build_results else "No compiler available; user compilation required",
                "Unit tests executed from ./tests/ directory" if test_results else "No unit tests found",
                "All modules in source format (.h/.c) for integration",
                "Focus on current generated project only",
                "Verify module dependencies before compilation" if not build_results else "Check compilation errors above"
            ]
        }

    def _find_compiler(self) -> str | None:
        """Find available C compiler (gcc/clang)."""
        from shutil import which
        for compiler in ["gcc", "clang", "cc"]:
            if which(compiler):
                logging.info(f"Found compiler: {compiler}")
                return compiler
        logging.warning("No C compiler found (gcc/clang)")
        return None

    def _compile_modules(self, compiler: str, module_artifacts: Dict[str, Any], output_dir: Path) -> Dict[str, Any]:
        """Compile all modules and return compilation results."""
        build_dir = output_dir / "build"
        build_dir.mkdir(exist_ok=True)
        
        compilation_results = {
            "status": "success",
            "compiler": compiler,
            "modules": {},
            "errors": [],
            "warnings": []
        }
        
        for module_id, files in module_artifacts.items():
            try:
                sources = []
                if "source" in files:
                    sources.append(Path(files["source"]))
                
                if not sources:
                    compilation_results["modules"][module_id] = {"status": "skipped", "reason": "no_source_files"}
                    continue
                
                # Get include directory
                include_dir = Path(files.get("source", "")).parent
                output_path = build_dir / f"{module_id}.elf"
                
                # Compile with strict flags
                args = [
                    compiler, "-Wall", "-Wextra", "-std=c99", "-fPIC",
                    "-I", str(include_dir),
                    "-o", str(output_path)
                ] + [str(s) for s in sources]
                
                proc = subprocess.run(args, capture_output=True, text=True, timeout=30)
                
                if proc.returncode == 0:
                    compilation_results["modules"][module_id] = {
                        "status": "success",
                        "output": str(output_path),
                        "size": output_path.stat().st_size if output_path.exists() else 0
                    }
                else:
                    compilation_results["status"] = "partial_success"
                    compilation_results["modules"][module_id] = {"status": "failed", "error": proc.stderr}
                    compilation_results["errors"].append({"module": module_id, "error": proc.stderr})
                
                if proc.stdout:
                    compilation_results["warnings"].append({"module": module_id, "output": proc.stdout})
                    
            except subprocess.TimeoutExpired:
                compilation_results["status"] = "partial_success"
                compilation_results["modules"][module_id] = {"status": "timeout"}
                compilation_results["errors"].append({"module": module_id, "error": "compilation timeout"})
            except Exception as e:
                compilation_results["status"] = "partial_success"
                compilation_results["modules"][module_id] = {"status": "error", "error": str(e)}
                compilation_results["errors"].append({"module": module_id, "error": str(e)})
        
        return compilation_results

    def _run_tests(self, output_dir: Path, module_artifacts: Dict[str, Any], compiler: str | None) -> Dict[str, Any] | None:
        """Compile and run unit tests if test files exist."""
        test_dir = output_dir / "tests"
        build_dir = output_dir / "build"
        
        if not test_dir.exists():
            return None

        # Require compiler to build tests
        if not compiler:
            return {
                "status": "not_executed",
                "reason": "no_compiler_found"
            }

        # Collect test source files
        test_sources = [p for p in test_dir.rglob("*") if p.is_file() and not p.name.endswith(".meta.json")]
        if not test_sources:
            return None

        # Compile test sources into executables
        build_dir.mkdir(exist_ok=True)
        module_sources = [Path(v["source"]) for v in module_artifacts.values() if "source" in v]
        include_dirs = {Path(v["source"]).parent for v in module_artifacts.values() if "source" in v}
        include_dirs.add(test_dir)

        test_executables: List[Path] = []
        test_results = {
            "timestamp": datetime.now().isoformat(),
            "all_passed": True,
            "test_modules": {},
            "total_passed": 0,
            "total_failed": 0,
            "summary": {},
            "compilation": {
                "status": "success",
                "compiler": compiler,
                "errors": []
            }
        }

        for test_src in test_sources:
            module_name = test_src.stem
            exe_suffix = ".exe" if platform.system().lower().startswith("win") else ""
            output_path = build_dir / f"{module_name}_test{exe_suffix}"

            args = [
                compiler, "-Wall", "-Wextra", "-std=c99", "-fPIC",
            ]
            for inc in sorted(include_dirs):
                args += ["-I", str(inc)]

            # Force C language for non-.c files
            if test_src.suffix != ".c":
                args += ["-x", "c"]

            args += [str(test_src)] + [str(s) for s in module_sources] + ["-o", str(output_path)]

            proc = subprocess.run(args, capture_output=True, text=True, timeout=30)
            if proc.returncode != 0:
                test_results["compilation"]["status"] = "partial_success"
                test_results["compilation"]["errors"].append({
                    "test": module_name,
                    "error": proc.stderr or proc.stdout
                })
                test_results["test_modules"][module_name] = {
                    "executable": str(output_path),
                    "passed": False,
                    "error": "test compilation failed",
                    "compile_output": (proc.stdout or "") + (proc.stderr or "")
                }
                test_results["all_passed"] = False
                test_results["total_failed"] += 1
                continue

            if output_path.exists():
                test_executables.append(output_path)
        
        for test_exe in test_executables:
            module_name = test_exe.stem.replace("_test", "").replace("test_", "")
            try:
                proc = subprocess.run(
                    [str(test_exe)],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                passed = proc.returncode == 0
                test_results["test_modules"][module_name] = {
                    "executable": str(test_exe),
                    "passed": passed,
                    "output": proc.stdout + proc.stderr
                }
                
                if passed:
                    test_results["total_passed"] += 1
                else:
                    test_results["all_passed"] = False
                    test_results["total_failed"] += 1
                    
            except subprocess.TimeoutExpired:
                test_results["all_passed"] = False
                test_results["total_failed"] += 1
                test_results["test_modules"][module_name] = {
                    "executable": str(test_exe),
                    "passed": False,
                    "error": "test timeout"
                }
            except Exception as e:
                test_results["all_passed"] = False
                test_results["total_failed"] += 1
                test_results["test_modules"][module_name] = {
                    "executable": str(test_exe),
                    "passed": False,
                    "error": str(e)
                }
        
        test_results["summary"] = {
            "total_tests": len(test_executables),
            "passed": test_results["total_passed"],
            "failed": test_results["total_failed"]
        }
        
        return test_results
