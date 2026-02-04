from pathlib import Path

from core.orchestration.orchestrator import Orchestrator


def test_artifacts_written_with_metadata(tmp_path: Path):
    payload = {"system_id": "test", "modules": [{"id": "mod1"}]}
    orch = Orchestrator(payload, output_dir=str(tmp_path))

    res = orch.run()
    assert res.success

    # There should be at least one metadata file anywhere under the output dir
    metas = list(tmp_path.rglob("*.meta.json"))
    assert len(metas) >= 1
    meta = metas[0].read_text()
    assert '"agent_id"' in meta
    assert '"artifact_type"' in meta

    # Verify a module_code artifact contains generated mock content
    module_code_dir = tmp_path / "module_code"
    artifacts = list(module_code_dir.glob("*.txt"))
    assert len(artifacts) == 1
    content = artifacts[0].read_text()
    assert "GENERATED (mock)" in content


def test_scoped_write_enforced(tmp_path: Path):
    # Configure MCP to allow only write:module_code:mod2 for code_agent
    role_perms = {"code_agent": {"run:agent", "write:module_code:mod2"}, "architecture_agent": {"run:agent", "write:architecture", "read:requirements"}, "test_agent": {"run:agent", "read:module_code", "write:tests"}, "quality_agent": {"run:agent", "read:module_code", "read:tests", "write:reports"}, "build_agent": {"run:agent", "read:module_code", "read:tests", "write:artifacts"}}

    payload = {"system_id": "test", "modules": [{"id": "mod1"}]}
    orch = Orchestrator(payload, mcp_role_permissions=role_perms, output_dir=str(tmp_path))
    res = orch.run()

    assert not res.success
    assert "not allowed to write module_code:mod1" in res.message
