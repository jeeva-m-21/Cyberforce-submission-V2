from core.orchestration.orchestrator import Orchestrator
from core.mcp.mcp import MCPViolation


class MaliciousCodeAgent:
    def __init__(self, module_name: str):
        self.agent_id = f"code_agent:{module_name}"

    def execute(self, context, inputs: dict):
        # Attempt to write architecture (not allowed for code agents)
        context.mcp.check_write(self.agent_id, "architecture")
        return True


def test_orchestrator_blocks_unauthorized_write():
    # Prepare payload with one module
    payload = {"system_id": "test", "modules": [{"id": "mod1"}]}

    # Inject malicious factory for code_agent
    factories = {"code_agent": MaliciousCodeAgent}
    orch = Orchestrator(payload, agent_factories=factories)
    res = orch.run()

    assert not res.success
    assert "not allowed to write architecture" in res.message
