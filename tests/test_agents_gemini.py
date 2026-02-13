from types import SimpleNamespace
from pathlib import Path

from core.mcp.mcp import MCP
from core.ai.gemini_wrapper import MockGemini
from core.ai.prompt import PromptLoader
from agents.architecture_agent import ArchitectureAgent
from agents.code_agent import CodeAgent
from agents.test_agent import TestAgent

# Get project root (one level up from tests directory)
PROJECT_ROOT = Path(__file__).parent.parent


def make_context(tmp_path: Path):
    mcp = MCP(audit_log=tmp_path / "audit.log")
    llm = MockGemini()
    prompt_loader = PromptLoader(PROJECT_ROOT / "prompts")
    rag = SimpleNamespace(query=lambda q, top_k=3: ["doc1 snippet", "doc2 snippet"])  # lightweight stub
    return SimpleNamespace(mcp=mcp, rag=rag, llm=llm, prompt_loader=prompt_loader, output_dir=str(tmp_path))


def test_architecture_agent_uses_llm_and_respects_mcp(tmp_path: Path):
    ctx = make_context(tmp_path)
    agent = ArchitectureAgent()

    res = agent.execute(ctx, {"system_id": "s1"})

    assert res.success
    # Verify artifact exists and contains the generated content
    assert res.artifact_path
    content = Path(res.artifact_path).read_text()
    assert "GENERATED (mock)" in content


def test_code_agent_generates_per_module(tmp_path: Path):
    ctx = make_context(tmp_path)
    agent = CodeAgent("mod1")

    res = agent.execute(ctx, {"id": "mod1", "responsibility": "foo"})
    assert res.success
    assert res.artifact_path
    content = Path(res.artifact_path).read_text()
    assert "GENERATED (mock)" in content


def test_test_agent_reads_code_and_uses_llm(tmp_path: Path):
    ctx = make_context(tmp_path)
    # give permissions to read module_code so test_agent can run normally
    agent = TestAgent()
    res = agent.execute(ctx, {"id": "mod1"})
    assert res.success
    assert res.artifact_path
    content = Path(res.artifact_path).read_text()
    assert "GENERATED (mock)" in content
