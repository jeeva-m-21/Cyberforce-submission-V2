from pathlib import Path
from types import SimpleNamespace
import subprocess

import pytest

from agents.build_agent import BuildAgent
from core.artifacts import write_artifact


class DummyProc:
    def __init__(self, returncode=0, stdout="", stderr=""):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def make_context(tmp_path: Path):
    mcp = SimpleNamespace(check_write=lambda *a, **k: True, check_read=lambda *a, **k: True, check_run=lambda *a, **k: True)
    # minimal context for binary writing
    def write(path, text):
        p = tmp_path / path
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")

    ctx = SimpleNamespace(mcp=mcp, output_dir=str(tmp_path))
    return ctx


def test_build_agent_packages_sources_and_writes_artifact(monkeypatch, tmp_path: Path):
    # Prepare a module_code artifact (as write_artifact would produce)
    ctx = make_context(tmp_path)
    # write a simple C source file into module_code dir
    module_code_dir = tmp_path / "module_code"
    module_code_dir.mkdir()
    src = module_code_dir / "code_agent_mod1.txt"
    src.write_text("int main(){return 0;}\n", encoding="utf-8")

    # Mock compiler detection to indicate no compiler (test packaging path)
    monkeypatch.setattr("agents.build_agent.build_utils.find_compiler", lambda *_: None)

    agent = BuildAgent()
    res = agent.execute(ctx, {"modules": [{"id": "mod1"}]})

    assert res.success
    assert res.artifact_path
    p = Path(res.artifact_path)
    assert p.exists()
    # meta should exist
    assert p.with_suffix('.meta.json').exists()


def test_build_agent_compilation(monkeypatch, tmp_path: Path):
    # Test compile path by mocking compiler and compile_sources
    ctx = make_context(tmp_path)
    module_code_dir = tmp_path / "module_code"
    module_code_dir.mkdir()
    src = module_code_dir / "code_agent_mod1.txt"
    src.write_text("int main(){return 0;}\n", encoding="utf-8")

    monkeypatch.setattr("agents.build_agent.build_utils.find_compiler", lambda *_: "gcc")
    monkeypatch.setattr("agents.build_agent.build_utils.compile_sources", lambda compiler, sources, out: (True, "ok", ""))

    agent = BuildAgent()
    res = agent.execute(ctx, {"modules": [{"id": "mod1"}]})

    assert res.success
    p = Path(res.artifact_path)
    assert p.exists()
    data = p.with_suffix('.meta.json').read_text()
    assert '"checksum_sha256"' in data
