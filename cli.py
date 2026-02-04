"""CLI entrypoint for CyberForge-26. CLI is purposely thin — it only validates inputs and invokes the orchestrator.
"""
from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import click
from dotenv import load_dotenv

from core.orchestration.orchestrator import Orchestrator

# Load environment variables from .env file
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cyberforge")


@click.command()
@click.option("--input", "input_file", required=True, type=click.Path(exists=True, dir_okay=False), help="Path to the JSON/YAML input describing system and modules")
def main(input_file: str) -> None:
    """Run the orchestration pipeline with the provided input."""
    logger.info("Starting CyberForge-26 orchestration")

    p = Path(input_file)
    try:
        payload = json.loads(p.read_text())
    except Exception:
        logger.error("Failed to parse input; only JSON supported in v0")
        sys.exit(2)

    orch = Orchestrator(payload)
    res = orch.run()

    if not res.success:
        logger.error("Orchestration failed: %s", res.message)
        sys.exit(1)

    logger.info("Orchestration completed successfully")


if __name__ == "__main__":
    main()
