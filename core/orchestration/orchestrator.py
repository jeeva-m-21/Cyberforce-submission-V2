"""Orchestration layer: executes agents deterministically via a DAG and enforces pipeline rules.
This is an intentionally minimal, auditable implementation with explicit ordering and logging.
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Any, Dict, List
from pathlib import Path
from datetime import datetime

import networkx as nx

logger = logging.getLogger("cyberforge.orchestrator")


@dataclass
class OrchestrationResult:
    success: bool
    message: str = ""
    details: Dict[str, Any] = None


class ExecutionContext:
    def __init__(self, mcp: "MCP", rag: "RAG", llm: "LLMClient", prompt_loader: "PromptLoader", output_dir: str = "output", run_id: str = None, project_name: str = None, payload: Dict[str, Any] = None):
        self.mcp = mcp
        self.rag = rag
        self.llm = llm
        self.prompt_loader = prompt_loader
        self.output_dir = output_dir
        self.run_id = run_id or datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        # Use project name as folder if provided, otherwise use timestamp
        folder_name = project_name.replace(" ", "_").replace("-", "_") if project_name else self.run_id
        self.run_output_dir = Path(output_dir) / "runs" / folder_name
        self.run_output_dir.mkdir(parents=True, exist_ok=True)
        # Store MCU and board specifications for agent access
        self.payload = payload or {}
        self.target_mcu = self.payload.get("target_mcu", "Unknown")
        self.optimization_goal = self.payload.get("optimization_goal", "balanced")
        self.modules = self.payload.get("modules", [])


class Orchestrator:
    def __init__(self, input_payload: Dict[str, Any], agent_factories: Dict[str, any] | None = None, mcp_role_permissions: Dict[str, set] | None = None, output_dir: str = "output", run_id: str | None = None, use_real_gemini: bool = False):
        self.payload = input_payload
        self.graph = nx.DiGraph()
        self._build_pipeline()
        # Allow tests to inject fake agents
        self.agent_factories = agent_factories or {}
        # Allow injection of custom MCP role permissions for tests
        self._mcp_role_permissions = mcp_role_permissions
        self.output_dir = output_dir
        self.run_id = run_id
        self.use_real_gemini = use_real_gemini

    def _build_pipeline(self) -> None:
        # Deterministic ordering enforced here — architecture -> code -> test -> quality -> build
        steps = [
            "architecture_agent",
            "code_agents",
            "test_agent",
            "quality_agent",
            "build_agent",
        ]
        for i in range(len(steps) - 1):
            self.graph.add_edge(steps[i], steps[i + 1])

    def run(self) -> OrchestrationResult:
        logger.info("Orchestration: starting run")
        # Lazy imports to avoid top-level heavy deps during unit tests
        from core.mcp.mcp import MCP, MCPViolation
        from core.rag.rag import RAG
        from core.ai.gemini_wrapper import create_llm_client
        from core.ai.prompt import PromptLoader
        from agents.architecture_agent import ArchitectureAgent
        from agents.code_agent import CodeAgent
        from agents.test_agent import TestAgent
        from agents.quality_agent import QualityAgent
        from agents.build_agent import BuildAgent

        # Set up LLM provider BEFORE creating the client
        if self.use_real_gemini:
            os.environ["USE_REAL_GEMINI"] = "1"
            logger.info("Orchestrator.run(): SET USE_REAL_GEMINI=1 (Gemini requested)")
        else:
            os.environ["USE_REAL_GEMINI"] = "0"
            logger.info("Orchestrator.run(): SET USE_REAL_GEMINI=0 (Mock requested)")

        # Get project root directory (2 levels up from this file)
        project_root = Path(__file__).parent.parent.parent
        
        mcp = MCP(audit_log=Path(self.output_dir) / "mcp_audit.log", role_permissions=self._mcp_role_permissions)
        rag = RAG(project_root / "rag_docs")
        
        logger.info(f"About to create LLM client - USE_REAL_GEMINI={os.environ.get('USE_REAL_GEMINI')}, GEMINI_API_KEY_present={bool(os.environ.get('GEMINI_API_KEY'))}")
        llm = create_llm_client()
        logger.info(f"LLM client created: {type(llm).__name__}")
        prompt_loader = PromptLoader(project_root / "prompts")
        run_id = self.run_id or datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        project_name = self.payload.get("project_name")
        ctx = ExecutionContext(mcp=mcp, rag=rag, llm=llm, prompt_loader=prompt_loader, output_dir=self.output_dir, run_id=run_id, project_name=project_name, payload=self.payload)

        details: Dict[str, Any] = {}
        architecture_only = bool(self.payload.get("architecture_only"))

        try:
            for node in nx.topological_sort(self.graph):
                logger.info("Running step: %s", node)
                if node == "architecture_agent":
                    factory = self.agent_factories.get("architecture_agent", ArchitectureAgent)
                    agent = factory()
                    try:
                        mcp.check_run(agent.agent_id)
                        res = agent.execute(ctx, self.payload)
                        details[agent.agent_id] = res
                        if not res.success:
                            return OrchestrationResult(success=False, message=f"{agent.agent_id} failed: {res.message}", details=details)
                    except MCPViolation as mv:
                        logger.error("MCP violation during %s: %s", agent.agent_id, mv)
                        return OrchestrationResult(success=False, message=str(mv), details=details)

                elif node == "code_agents":
                    if architecture_only:
                        logger.info("Architecture-only mode: skipping code agents")
                        break
                    
                    # Determine code generation strategy based on MCU hardware
                    from agents.code_agent import CodeAgent as CodeAgentClass
                    target_mcu = self.payload.get("target_mcu", "").lower()
                    mcu_format = CodeAgentClass.determine_mcu_format(target_mcu)
                    is_single_file = mcu_format["is_single_file"]
                    framework = mcu_format["framework"]
                    
                    modules = self.payload.get("modules", [])
                    
                    if is_single_file:
                        # Single-file firmware (Arduino, ESP32-Arduino, RP2040, etc.)
                        logger.info(f"Single-file MCU detected ({framework}): generating unified firmware file")
                        
                        factory = self.agent_factories.get("code_agent", CodeAgent)
                        project_name = self.payload.get("project_name", "firmware")
                        agent = factory("unified_firmware")
                        
                        try:
                            mcp.check_run(agent.agent_id)
                            # Pass ALL modules and hardware context
                            unified_input = {
                                "id": project_name.replace(" ", "_"),
                                "name": project_name,
                                "type": "unified",
                                "target_mcu": self.payload.get("target_mcu"),
                                "modules": modules,
                                "all_modules": modules,
                                "project_name": project_name
                            }
                            res = agent.execute(ctx, unified_input)
                            details[agent.agent_id] = res
                            if not res.success:
                                return OrchestrationResult(success=False, message=f"{agent.agent_id} failed: {res.message}", details=details)
                        except MCPViolation as mv:
                            logger.error("MCP violation during %s: %s", agent.agent_id, mv)
                            return OrchestrationResult(success=False, message=str(mv), details=details)
                    else:
                        # Modular firmware (STM32, nRF52, PIC32, etc.)
                        logger.info(f"Modular MCU detected ({framework}): generating per-module code")
                        for mod in modules:
                            module_id = mod.get("id")
                            if not module_id:
                                logger.warning("Module missing 'id' field, skipping: %s", mod)
                                continue
                            factory = self.agent_factories.get("code_agent", CodeAgent)
                            agent = factory(module_id)
                            try:
                                mcp.check_run(agent.agent_id)
                                res = agent.execute(ctx, mod)
                                details[agent.agent_id] = res
                                if not res.success:
                                    return OrchestrationResult(success=False, message=f"{agent.agent_id} failed: {res.message}", details=details)
                            except MCPViolation as mv:
                                logger.error("MCP violation during %s: %s", agent.agent_id, mv)
                                return OrchestrationResult(success=False, message=str(mv), details=details)

                elif node == "test_agent":
                    if architecture_only:
                        logger.info("Architecture-only mode: skipping test agent")
                        break
                    factory = self.agent_factories.get("test_agent", TestAgent)
                    agent = factory()
                    try:
                        mcp.check_run(agent.agent_id)
                        res = agent.execute(ctx, self.payload)
                        details[agent.agent_id] = res
                        if not res.success:
                            return OrchestrationResult(success=False, message=f"{agent.agent_id} failed: {res.message}", details=details)
                    except MCPViolation as mv:
                        logger.error("MCP violation during %s: %s", agent.agent_id, mv)
                        return OrchestrationResult(success=False, message=str(mv), details=details)

                elif node == "quality_agent":
                    if architecture_only:
                        logger.info("Architecture-only mode: skipping quality agent")
                        break
                    factory = self.agent_factories.get("quality_agent", QualityAgent)
                    agent = factory()
                    try:
                        mcp.check_run(agent.agent_id)
                        res = agent.execute(ctx, self.payload)
                        details[agent.agent_id] = res
                        if not res.success:
                            return OrchestrationResult(success=False, message=f"{agent.agent_id} failed: {res.message}", details=details)
                    except MCPViolation as mv:
                        logger.error("MCP violation during %s: %s", agent.agent_id, mv)
                        return OrchestrationResult(success=False, message=str(mv), details=details)

                elif node == "build_agent":
                    if architecture_only:
                        logger.info("Architecture-only mode: skipping build agent")
                        break
                    factory = self.agent_factories.get("build_agent", BuildAgent)
                    agent = factory()
                    try:
                        mcp.check_run(agent.agent_id)
                        res = agent.execute(ctx, self.payload)
                        details[agent.agent_id] = res
                        if not res.success:
                            return OrchestrationResult(success=False, message=f"{agent.agent_id} failed: {res.message}", details=details)
                    except MCPViolation as mv:
                        logger.error("MCP violation during %s: %s", agent.agent_id, mv)
                        return OrchestrationResult(success=False, message=str(mv), details=details)

            return OrchestrationResult(success=True, message="All steps executed", details=details)
        except Exception as exc:
            logger.exception("Orchestration failed")
            return OrchestrationResult(success=False, message=str(exc), details=details)
