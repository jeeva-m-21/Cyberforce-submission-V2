"""Prompt loader and composer for agents.

Prompts are versioned files under `prompts/` and are composed with the base prompt.
"""
from __future__ import annotations

from pathlib import Path
from typing import List


class PromptLoader:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir

    def load(self, agent_name: str, version: str = "v1") -> str:
        base = (self.base_dir / "base_prompt.md").read_text()
        specific = (self.base_dir / f"{agent_name}_prompt_{version}.md").read_text()
        return base + "\n\n" + specific

    def compose(self, agent_name: str, constraints: str = "", rag_context: List[str] | None = None, module: dict | None = None) -> str:
        prompt = self.load(agent_name)
        rag_section = "\n---\n".join(rag_context or [])
        module_section = str(module) if module is not None else ""
        prompt = prompt.replace("<<AGENT_ROLE>>", agent_name)
        prompt = prompt.replace("<<CONSTRAINTS>>", constraints)
        prompt = prompt.replace("<<RAG_CONTEXT>>", rag_section)
        prompt = prompt.replace("<<MODULE>>", module_section)
        return prompt
