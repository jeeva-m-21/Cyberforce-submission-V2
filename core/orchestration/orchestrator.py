"""Orchestration layer: executes agents deterministically via a DAG and enforces pipeline rules.
This is an intentionally minimal, auditable implementation with explicit ordering and logging.
"""
from __future__ import annotations

import logging
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
    def __init__(self, mcp: "MCP", rag: "RAG", llm: "LLMClient", prompt_loader: "PromptLoader", output_dir: str = "output", run_id: str = None):
        self.mcp = mcp
        self.rag = rag
        self.llm = llm
        self.prompt_loader = prompt_loader
        self.output_dir = output_dir
        self.run_id = run_id or datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        self.run_output_dir = Path(output_dir) / "runs" / self.run_id
        self.run_output_dir.mkdir(parents=True, exist_ok=True)


class Orchestrator:
    def __init__(self, input_payload: Dict[str, Any], agent_factories: Dict[str, any] | None = None, mcp_role_permissions: Dict[str, set] | None = None, output_dir: str = "output"):
        self.payload = input_payload
        self.graph = nx.DiGraph()
        self._build_pipeline()
        # Allow tests to inject fake agents
        self.agent_factories = agent_factories or {}
        # Allow injection of custom MCP role permissions for tests
        self._mcp_role_permissions = mcp_role_permissions
        self.output_dir = output_dir

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

        mcp = MCP(audit_log=Path(self.output_dir) / "mcp_audit.log", role_permissions=self._mcp_role_permissions)
        rag = RAG(Path("rag_docs"))
        llm = create_llm_client()
        prompt_loader = PromptLoader(Path("prompts"))
        run_id = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        ctx = ExecutionContext(mcp=mcp, rag=rag, llm=llm, prompt_loader=prompt_loader, output_dir=self.output_dir, run_id=run_id)

        details: Dict[str, Any] = {}

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
                    modules = self.payload.get("modules", [])
                    for mod in modules:
                        module_id = mod.get("id")
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
