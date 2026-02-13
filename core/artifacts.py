"""Artifact utilities: persist artifacts with metadata in a structured, auditable way.

Supports:
- Single-file artifacts (text, JSON, binary)
- Multi-file artifacts with automatic .h/.c separation
- Metadata sidecars for traceability
- MCP authorization checks

Functions:
- write_artifact(context, agent_id, artifact_type, content, ...) -> Path | List[Path]
- write_modular_code(context, agent_id, module_id, header_code, source_code, ...) -> Dict[str, Path]
"""
from __future__ import annotations

import json
import logging
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union


@dataclass
class ArtifactMetadata:
    artifact_id: str
    agent_id: str
    artifact_type: str
    module_id: Optional[str]
    prompt_version: str
    requirement_id: Optional[str]
    timestamp: str
    artifact_format: str = "text"  # text, binary, multi-file
    sub_artifacts: Optional[List[str]] = None  # For multi-file tracking
    extra: Optional[Dict[str, Any]] = None


def write_artifact(context: Any, agent_id: str, artifact_type: str, content: str, 
                   metadata: Optional[Dict] = None, module_id: Optional[str] = None, 
                   prompt_version: str = "v1", extension: str = "txt") -> Path:
    """Write single-file text artifact with metadata sidecar.
    
    Args:
        extension: File extension (without dot), e.g. "txt", "md", "c", "ino"
    """
    resource = artifact_type if not module_id else f"{artifact_type}:{module_id}"
    context.mcp.check_write(agent_id, resource, metadata)

    out_dir = context.run_output_dir / artifact_type
    out_dir.mkdir(parents=True, exist_ok=True)

    artifact_id = str(uuid.uuid4())
    timestamp_iso = datetime.utcnow().isoformat() + "Z"
    timestamp_safe = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    safe_agent_id = agent_id.replace(":", "_")
    filename = f"{timestamp_safe}_{safe_agent_id}_{artifact_id}.{extension}"
    file_path = out_dir / filename

    file_path.write_text(content, encoding="utf-8")

    meta = ArtifactMetadata(
        artifact_id=artifact_id,
        agent_id=agent_id,
        artifact_type=artifact_type,
        module_id=module_id,
        prompt_version=prompt_version,
        requirement_id=metadata.get("requirement_id") if metadata else None,
        timestamp=timestamp_iso,
        artifact_format="text",
        extra={**(metadata or {})},
    )
    meta_path = file_path.with_suffix(".meta.json")
    meta_path.write_text(json.dumps(asdict(meta), indent=2), encoding="utf-8")

    # For quality reports and build logs, also create a standardized "latest" copy
    if agent_id == "quality_agent" and artifact_type == "reports":
        try:
            latest_path = out_dir / "quality_report_latest.json"
            latest_path.write_text(content, encoding="utf-8")
        except Exception as e:
            logging.warning(f"Could not create quality_report_latest.json: {e}")

    return file_path


def write_modular_code(context: Any, agent_id: str, module_id: str, 
                       header_code: str, source_code: str,
                       metadata: Optional[Dict] = None, 
                       prompt_version: str = "v1") -> Dict[str, Path]:
    """
    Write modular C code as separate .h and .c files.
    
    Returns dict with keys "header" and "source" pointing to files.
    Creates shared metadata.json tracking both files.
    """
    if not module_id:
        raise ValueError(f"module_id cannot be None or empty. Received: {module_id}")
    if not context.run_output_dir:
        raise ValueError(f"context.run_output_dir cannot be None. Context: {context}")
    
    resource = f"module_code:{module_id}"
    context.mcp.check_write(agent_id, resource, metadata)

    artifact_type = "module_code"
    out_dir = context.run_output_dir / artifact_type / module_id
    out_dir.mkdir(parents=True, exist_ok=True)

    artifact_id = str(uuid.uuid4())
    timestamp_iso = datetime.utcnow().isoformat() + "Z"
    timestamp_safe = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    safe_agent_id = agent_id.replace(":", "_")
    
    # Create header file
    header_filename = f"{module_id}.h"
    header_path = out_dir / header_filename
    header_path.write_text(header_code, encoding="utf-8")
    
    # Create source file
    source_filename = f"{module_id}.c"
    source_path = out_dir / source_filename
    source_path.write_text(source_code, encoding="utf-8")
    
    # Create shared metadata for both files
    meta = ArtifactMetadata(
        artifact_id=artifact_id,
        agent_id=agent_id,
        artifact_type="module_code",
        module_id=module_id,
        prompt_version=prompt_version,
        requirement_id=metadata.get("requirement_id") if metadata else None,
        timestamp=timestamp_iso,
        artifact_format="multi-file",
        sub_artifacts=[header_filename, source_filename],
        extra={**(metadata or {})},
    )
    
    meta_path = out_dir / f"_artifact_{artifact_id}.meta.json"
    meta_path.write_text(json.dumps(asdict(meta), indent=2), encoding="utf-8")
    
    return {
        "header": header_path,
        "source": source_path,
        "metadata": meta_path,
        "module_id": module_id
    }


def write_json_artifact(context: Any, agent_id: str, artifact_type: str, 
                        data: Dict[str, Any], metadata: Optional[Dict] = None, 
                        module_id: Optional[str] = None, 
                        prompt_version: str = "v1") -> Path:
    """Write JSON artifact (e.g., quality reports, architecture)."""
    resource = artifact_type if not module_id else f"{artifact_type}:{module_id}"
    context.mcp.check_write(agent_id, resource, metadata)

    out_dir = context.run_output_dir / artifact_type
    out_dir.mkdir(parents=True, exist_ok=True)

    artifact_id = str(uuid.uuid4())
    timestamp_iso = datetime.utcnow().isoformat() + "Z"
    timestamp_safe = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    safe_agent_id = agent_id.replace(":", "_")
    filename = f"{timestamp_safe}_{safe_agent_id}_{artifact_id}.json"
    file_path = out_dir / filename

    # Write JSON data
    file_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    meta = ArtifactMetadata(
        artifact_id=artifact_id,
        agent_id=agent_id,
        artifact_type=artifact_type,
        module_id=module_id,
        prompt_version=prompt_version,
        requirement_id=metadata.get("requirement_id") if metadata else None,
        timestamp=timestamp_iso,
        artifact_format="json",
        extra={**(metadata or {})},
    )
    meta_path = file_path.with_suffix(".meta.json")
    meta_path.write_text(json.dumps(asdict(meta), indent=2), encoding="utf-8")

    # For build logs, also create a standardized "build_log.json" copy
    if agent_id == "build_agent" and artifact_type == "build_log":
        try:
            latest_path = out_dir / "build_log.json"
            latest_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
            logging.info(f"Created standardized build log: {latest_path}")
        except Exception as e:
            logging.warning(f"Could not create build_log.json: {e}")

    return file_path

def write_single_file_code(context: Any, agent_id: str, project_name: str,
                            code_content: str, metadata: Optional[Dict] = None,
                            prompt_version: str = "v1", extension: str = "ino") -> Path:
    """
    Write single-file code artifact (e.g., Arduino .ino file).
    
    Args:
        project_name: Name of the project (used for filename)
        code_content: The complete code content
        extension: File extension (ino, cpp, c, etc.)
    
    Returns:
        Path to the created file
    """
    resource = f"firmware:{project_name}"
    context.mcp.check_write(agent_id, resource, metadata)

    artifact_type = "firmware"
    out_dir = context.run_output_dir / artifact_type
    out_dir.mkdir(parents=True, exist_ok=True)

    artifact_id = str(uuid.uuid4())
    timestamp_iso = datetime.utcnow().isoformat() + "Z"
    timestamp_safe = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    
    # Use project name for Arduino files
    filename = f"{project_name}.{extension}"
    file_path = out_dir / filename
    
    # Write code file
    file_path.write_text(code_content, encoding="utf-8")
    
    # Create metadata
    meta = ArtifactMetadata(
        artifact_id=artifact_id,
        agent_id=agent_id,
        artifact_type=artifact_type,
        module_id=None,
        prompt_version=prompt_version,
        requirement_id=metadata.get("requirement_id") if metadata else None,
        timestamp=timestamp_iso,
        artifact_format="single_file",
        extra={**(metadata or {})},
    )
    
    meta_path = file_path.with_suffix(f".{extension}.meta.json")
    meta_path.write_text(json.dumps(asdict(meta), indent=2), encoding="utf-8")
    
    return file_path