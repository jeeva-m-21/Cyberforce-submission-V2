"""Model Control Protocol (MCP) enforcement and audit logging.

Provides role-based authorization checks and a persistent audit trail. Agents must call
methods on the MCP instance (provided via the execution context) to request writes and other actions.
Unauthorized requests raise MCPViolation and must abort the pipeline.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger("cyberforge.mcp")


class MCPViolation(Exception):
    """Raised when an agent attempts an action disallowed by MCP."""


@dataclass
class AuditEntry:
    timestamp: str
    agent_id: str
    action: str
    resource: str
    allowed: bool
    reason: Optional[str] = None
    metadata: Optional[Dict] = None


class MCP:
    def __init__(self, audit_log: Path = Path("output/mcp_audit.log"), role_permissions: Optional[Dict[str, set]] = None):
        self.audit_log = audit_log
        self.audit_log.parent.mkdir(parents=True, exist_ok=True)
        # Default permissions - conservative by default
        self.role_permissions: Dict[str, set] = role_permissions or {
            "architecture_agent": {"read:requirements", "write:architecture", "run:agent"},
            "code_agent": {"run:agent", "write:module_code", "read:architecture"},
            "test_agent": {"run:agent", "read:module_code", "write:tests"},
            "quality_agent": {"run:agent", "read:module_code", "read:tests", "write:reports"},
            "build_agent": {"run:agent", "read:module_code", "read:tests", "write:artifacts", "write:build_log"},
        }

    def _role_for(self, agent_id: str) -> str:
        # code agents are named like code_agent:MODULE; generalize role 'code_agent'
        if agent_id.startswith("code_agent"):
            return "code_agent"
        return agent_id

    def _log(self, entry: AuditEntry) -> None:
        try:
            with self.audit_log.open("a", encoding="utf-8") as f:
                f.write(json.dumps(entry.__dict__) + "\n")
        except Exception as exc:
            logger.exception("Failed to write MCP audit log: %s", exc)

    def authorize(self, agent_id: str, action: str, resource: str, metadata: Optional[Dict] = None) -> bool:
        role = self._role_for(agent_id)
        perms = self.role_permissions.get(role, set())
        # Allow exact match or prefix-based parent permission: e.g., write:module_code allows write:module_code:mod1
        exact = f"{action}:{resource}" in perms
        parts = resource.split(":")
        prefix = f"{action}:{parts[0]}" if parts else f"{action}:{resource}"
        parent = prefix in perms
        allowed = exact or parent or (action == "run" and "run:agent" in perms)
        reason = None if allowed else "permission denied"
        entry = AuditEntry(timestamp=datetime.utcnow().isoformat() + "Z", agent_id=agent_id, action=action, resource=resource, allowed=allowed, reason=reason, metadata=metadata)
        self._log(entry)
        logger.debug("MCP authorize: %s %s on %s -> %s", agent_id, action, resource, allowed)
        return allowed

    def check_write(self, agent_id: str, resource: str, metadata: Optional[Dict] = None) -> None:
        if not self.authorize(agent_id, "write", resource, metadata):
            logger.warning("MCP violation: %s attempted write:%s", agent_id, resource)
            raise MCPViolation(f"Agent {agent_id} not allowed to write {resource}")

    def check_read(self, agent_id: str, resource: str, metadata: Optional[Dict] = None) -> None:
        if not self.authorize(agent_id, "read", resource, metadata):
            logger.warning("MCP violation: %s attempted read:%s", agent_id, resource)
            raise MCPViolation(f"Agent {agent_id} not allowed to read {resource}")

    def check_run(self, agent_id: str) -> None:
        if not self.authorize(agent_id, "run", agent_id):
            logger.warning("MCP violation: %s attempted to run", agent_id)
            raise MCPViolation(f"Agent {agent_id} not allowed to run")
