# Artifact Type System & Modular Code Generation

## Overview

CyberForge-26 now supports **artifact type configuration** and **automatic modular code separation**. 

- **Artifact Types**: Defined in `schemas/artifact_types.json`
- **Module Code**: Automatically separated into `.h` (header) and `.c` (source) files
- **Build Agent**: Now generates source-only artifacts (no binaries); user compiles
- **Metadata**: Enhanced to track multi-file artifacts and artifact format

## Artifact Types Schema

File: `schemas/artifact_types.json`

### Structure

Each artifact type specifies:

```json
{
  "artifact_type_name": {
    "description": "Human-readable description",
    "format": "text | binary | json | multi-file | archive",
    "extension": ".c",
    "separable": true,
    "sub_types": [
      {"name": "header", "extension": ".h"},
      {"name": "source", "extension": ".c"}
    ],
    "compile": false,
    "agent": "code_agent",
    "required_metadata": ["module_id", "prompt_version"],
    "optional_metadata": ["standards", "dependencies"]
  }
}
```

### Current Artifact Types

| Type | Format | Separable | Agent | Files |
|------|--------|-----------|-------|-------|
| **module_code** | multi-file | YES | code_agent | `.h` + `.c` |
| **unit_tests** | text | NO | test_agent | `.c` |
| **quality_report** | json | NO | quality_agent | `.json` |
| **architecture** | json | NO | architecture_agent | `.json` |
| **build_log** | json | NO | build_agent | `.json` |

## Module Code Generation (Modular)

### File Structure

```
output/module_code/
├── temp_sensor/
│   ├── temp_sensor.h          (header: declarations, structs, macros)
│   ├── temp_sensor.c          (source: implementation)
│   └── _artifact_UUID.meta.json (shared metadata for both files)
├── logger/
│   ├── logger.h
│   ├── logger.c
│   └── _artifact_UUID.meta.json
├── comm/
│   ├── comm.h
│   ├── comm.c
│   └── _artifact_UUID.meta.json
└── ota/
    ├── ota.h
    ├── ota.c
    └── _artifact_UUID.meta.json
```

### Code Agent Workflow

```python
# 1. Generate code (agent should return JSON or marked sections)
{
  "header": "#ifndef TEMP_SENSOR_H\n...",
  "source": "#include \"temp_sensor.h\"\n..."
}

# 2. Automatic separation into .h and .c
write_modular_code(
    context=context,
    agent_id="code_agent:temp_sensor",
    module_id="temp_sensor",
    header_code=header_code,
    source_code=source_code,
    metadata={"standards": "MISRA-C-2012"}
)

# Result:
# - output/module_code/temp_sensor/temp_sensor.h
# - output/module_code/temp_sensor/temp_sensor.c
# - output/module_code/temp_sensor/_artifact_UUID.meta.json
```

### Header/Source Extraction

The CodeAgent automatically extracts headers and source from LLM output. Supports:

**1. JSON Format** (Preferred)
```json
{
  "header": "#ifndef MODULE_H\n#define MODULE_H\n...",
  "source": "#include \"module.h\"\n..."
}
```

**2. Marked Sections**
```c
###HEADER###
#ifndef MODULE_H
...
###SOURCE###
#include "module.h"
...
```

**3. Automatic Fallback**
- Splits at first function definition
- If no clear boundary, splits in middle

## Build Agent (Source-Only)

The Build Agent **no longer generates binaries**. Instead:

1. **Validates** all module `.h` and `.c` files exist
2. **Generates build_log.json** with compilation instructions
3. **Reports readiness** for user compilation

### Build Log Output

```json
{
  "build_type": "source_only",
  "compilation_status": "skipped",
  "compilation_instructions": "gcc -I. *.c -o firmware.elf",
  "modules": {
    "temp_sensor": {
      "header": "output/module_code/temp_sensor/temp_sensor.h",
      "source": "output/module_code/temp_sensor/temp_sensor.c",
      "header_size": 1024,
      "source_size": 2048
    }
  },
  "notes": [
    "Module code generated in source format",
    "User responsible for compilation",
    "Verify module dependencies before compiling"
  ]
}
```

### User Compilation

After pipeline completes, user compiles:

```bash
cd output/module_code
gcc -I. temp_sensor/*.c logger/*.c comm/*.c ota/*.c -o firmware.elf
```

Or with Makefile:
```makefile
SOURCES := $(wildcard */*/c)
HEADERS := $(wildcard */*.h)
CC := arm-none-eabi-gcc
CFLAGS := -Iinclude -fno-common

firmware.elf: $(SOURCES)
	$(CC) $(CFLAGS) $^ -o $@
```

## Artifact Metadata

### Enhanced ArtifactMetadata

```python
@dataclass
class ArtifactMetadata:
    artifact_id: str
    agent_id: str
    artifact_type: str
    module_id: Optional[str]
    prompt_version: str
    timestamp: str
    artifact_format: str  # "text", "json", "binary", "multi-file"
    sub_artifacts: Optional[List[str]]  # For multi-file tracking
    extra: Dict[str, Any]
```

### Example: Multi-File Metadata

```json
{
  "artifact_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_id": "code_agent:temp_sensor",
  "artifact_type": "module_code",
  "module_id": "temp_sensor",
  "prompt_version": "v1",
  "timestamp": "2026-02-04T12:34:56Z",
  "artifact_format": "multi-file",
  "sub_artifacts": ["temp_sensor.h", "temp_sensor.c"],
  "extra": {
    "standards": "MISRA-C-2012",
    "rag_context_used": true,
    "constraints": "No dynamic memory"
  }
}
```

## Artifact Manager Functions

### write_artifact()
Single-file text artifact with metadata sidecar.
```python
path = write_artifact(
    context=context,
    agent_id="code_agent:my_module",
    artifact_type="my_artifact",
    content="text content",
    metadata={"key": "value"},
    module_id="my_module"
)
```

### write_modular_code()
Multi-file code artifact (.h and .c separated).
```python
result = write_modular_code(
    context=context,
    agent_id="code_agent:temp_sensor",
    module_id="temp_sensor",
    header_code="...",
    source_code="...",
    metadata={"standards": "MISRA-C-2012"}
)

# result["header"]    → Path to .h file
# result["source"]    → Path to .c file
# result["metadata"]  → Path to .meta.json
```

### write_json_artifact()
JSON artifact (quality reports, architecture, build logs).
```python
path = write_json_artifact(
    context=context,
    agent_id="quality_agent",
    artifact_type="quality_report",
    data={"violations": [], "score": 95},
    metadata={"module_id": "temp_sensor"}
)
```

## Adding New Artifact Types

1. **Define in schemas/artifact_types.json:**
   ```json
   {
     "my_artifact_type": {
       "description": "My artifact",
       "format": "json|text|multi-file",
       "extension": ".json",
       "separable": false,
       "agent": "my_agent",
       "required_metadata": ["module_id"],
       "optional_metadata": ["tag"]
     }
   }
   ```

2. **Update Agent to use correct writer:**
   ```python
   from core.artifacts import write_json_artifact
   
   path = write_json_artifact(
       context=context,
       agent_id=self.agent_id,
       artifact_type="my_artifact_type",
       data=my_data
   )
   ```

3. **Set format field in metadata:**
   - "text" for plain text
   - "json" for structured data
   - "multi-file" for modular code
   - "binary" for compiled output (if enabled)

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Module Code** | Single `.txt` file with both header+source | Separate `.h` and `.c` files |
| **Organization** | `module_code/timestamp_uuid.txt` | `module_code/module_id/module_id.{h,c}` |
| **Metadata** | Basic | Tracks artifact format and sub-files |
| **Build Agent** | Generated binaries | Source-only, no compilation |
| **Customization** | Hardcoded | Schema-driven artifact types |

---

**Result**: Modular, compilable firmware code ready for integration into user's build system. No lock-in to CyberForge-26 toolchain.