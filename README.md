# CyberForge-26

**AI-assisted, governed firmware generation platform**

Project goal: Build a governed AI system for deterministic, auditable generation of embedded C/C++ firmware and associated artifacts (tests, reports, OTA images). This repository contains the scaffolding for the system described in `instruct.txt` and follows the mandated layered architecture.

Repository layout (strict):

- `core/` — orchestration, MCP, RAG
- `agents/` — specialized AI agents (one folder per agent)
- `schemas/` — JSON schemas for the CLI and artifacts
- `prompts/` — versioned prompt templates (immutable during execution)
- `rag_docs/` — grounding documents used by RAG
- `output/` — generated artifacts, build logs, and audit logs
- `cli.py` — CLI entrypoint

Quickstart (Windows):

1. Create virtual env and activate:
   - PowerShell: `python -m venv .venv; .\.venv\Scripts\Activate.ps1`
2. Install dev deps:
   - `pip install -r requirements-dev.txt`
3. Run tests and lint:
   - `pytest` and `flake8`

Git initialization (local machine):

- If `git` is installed: run `scripts\init_repo.ps1` in PowerShell to initialize and create the initial commit.
- If `git` is not installed, install Git for Windows: https://git-scm.com/download/win and then run `scripts\init_repo.ps1`.

Note: CI will run tests and linters automatically on push to `main` via GitHub Actions.

Notes and safety:
- The LLM uses a MockGemini by default (no external API calls). To enable a real Gemini client you must set `USE_REAL_GEMINI=1` and `GEMINI_API_KEY` (do NOT paste keys into chat or commit them to the repo). Use a secrets store for CI.

How to enable real Gemini (Windows PowerShell):

1. Set the env vars locally (PowerShell - current session):
   - `$env:GEMINI_API_KEY = "<your_api_key>"`
   - `$env:USE_REAL_GEMINI = "1"`

2. Persist for new terminals (PowerShell):
   - `setx GEMINI_API_KEY "<your_api_key>"`
   - `setx USE_REAL_GEMINI "1"`

3. Install the SDK and dependencies:
   - `pip install -r requirements.txt`

4. Run tests (integration will be skipped unless both env vars are set):
   - `pytest -q`

Security: Never commit `GEMINI_API_KEY` to source control. For CI, configure the secret in your GitHub repository settings and set `USE_REAL_GEMINI=1` only in protected runs.

See `docs/` for more design and governance details.
