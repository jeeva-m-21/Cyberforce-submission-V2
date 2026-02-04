"""Helper utilities for the Build Agent: compilation, packaging, and manifest creation."""
from __future__ import annotations

import subprocess
import tarfile
from datetime import datetime
from pathlib import Path
from typing import List, Tuple


def find_compiler(cc_env: str | None = None) -> str | None:
    from shutil import which

    cc = cc_env or "gcc"
    return which(cc)


def compile_sources(compiler: str, sources: List[Path], output_path: Path) -> Tuple[bool, str, str]:
    """Compile sources with the given compiler.

    Returns (success, stdout, stderr)
    """
    args = [compiler, "-o", str(output_path)] + [str(s) for s in sources]
    proc = subprocess.run(args, capture_output=True, text=True)
    return proc.returncode == 0, proc.stdout, proc.stderr


def create_package(source_dir: Path, output_package: Path) -> None:
    with tarfile.open(output_package, "w:gz") as tf:
        for p in sorted(source_dir.rglob("*")):
            tf.add(p, arcname=str(p.relative_to(source_dir)))
