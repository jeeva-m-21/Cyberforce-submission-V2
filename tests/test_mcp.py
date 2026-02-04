from pathlib import Path

from core.mcp.mcp import MCP, MCPViolation


def test_mcp_authorize_and_audit(tmp_path: Path):
    audit_path = tmp_path / "mcp_audit.log"
    m = MCP(audit_log=audit_path)

    # architecture_agent should be allowed to write architecture
    assert m.authorize("architecture_agent", "write", "architecture")

    # code_agent should be allowed to write module_code
    assert m.authorize("code_agent:mod1", "write", "module_code")

    # code_agent should NOT be allowed to write architecture
    allowed = m.authorize("code_agent:mod1", "write", "architecture")
    assert not allowed

    # check that audit file was created and contains entries
    text = audit_path.read_text()
    assert "architecture" in text
    assert "module_code" in text


def test_check_write_raises(tmp_path: Path):
    m = MCP(audit_log=tmp_path / "audit.log")
    # This should raise for disallowed resource
    try:
        m.check_write("code_agent:mod1", "architecture")
        assert False, "MCPViolation expected"
    except MCPViolation:
        assert True
