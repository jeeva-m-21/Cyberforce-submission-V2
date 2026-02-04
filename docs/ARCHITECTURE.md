# Architecture Overview

CyberForge-26 is layered (Interface, Orchestration, Agents, Governance/RAG, Execution, Artifacts).
Refer to `instruct.txt` for the non-negotiable project goals and design constraints.

Key principles:
- Deterministic orchestration using DAGs
- Strict MCP enforcement
- RAG-based retrieval for grounding code generation
- Auditability of all artifacts
