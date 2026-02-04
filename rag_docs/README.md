# RAG (Retrieval-Augmented Generation) Documents

Grounding documents for intelligent context injection: safety standards, protocols, patterns, and embedded best practices.

This folder is used by `core/rag/rag.py` to provide context to AI agents during firmware generation.

## Document Catalog

- **embedded_safety.md** — MISRA C:2012, CERT C, buffer safety, error handling
- **modbus_RS485.md** — Modbus protocol, CRC verification, register mapping
- **ota_firmware_updates.md** — Secure OTA, versioning, integrity, rollback patterns
- **interrupt_handling.md** — ISR design, race conditions, timing, watchdog
- **memory_management.md** — Static allocation, stack/heap, fragmentation, pools
- **hardware_interfaces.md** — GPIO, UART, ADC, PWM, I2C, SPI, Timer config
- **state_machines.md** — FSM design, events, guards, hierarchical, debugging
- **testing_strategies.md** — Unit tests, HIL, FSM testing, coverage
- **communication_protocols.md** — UART framing, CAN, I2C, Modbus, SPI
- **sensor_integration.md** — Sensor types, filtering, calibration, fusion
- **power_management.md** — Sleep modes, DVFS, battery monitoring, idle

## Intelligent Retrieval: RAG_METADATA.json

The metadata system enables efficient multi-dimensional document ranking:

**Domain Mapping** — safety, communication, rtos, memory, hardware, testing, power, ota, sensors, control-flow

**Module Type Mapping** — temp_sensor, logger, comm, ota (plus cross-module "all")

**Standards Coverage** — MISRA-C-2012, CERT-C, IEC-62304, AUTOSAR, DO-178B, ISO-11898

**Code Pattern Index** — error-codes, CRC-verification, ISR-pattern, firmware-header, state-enum, etc.

**Search Strategy** — Hybrid scoring: 40% keyword match + 30% domain relevance + 15% priority + 15% base weight

## How Agents Use RAG

1. **Query with context** — Code Agent calls `rag.query(query_text, module_type="temp_sensor")`
2. **Score documents** — RAG ranks by keywords, domain, priority, base weight
3. **Inject context** — Top-k documents (typically 3-5) injected into agent prompt
4. **Generate safely** — Agent code reflects safety standards, protocols, patterns

**Example:**
```python
context = rag.query(
    query_text="read temperature with ADC and filter noise",
    module_type="temp_sensor",
    top_k=3
)
# Returns:
# 1. sensor_integration.md (0.93 score)
# 2. hardware_interfaces.md (0.79 score)
# 3. embedded_safety.md (0.64 score)
```

## Adding New Documents

1. Create markdown file: `my_domain.md`
2. Add to `RAG_METADATA.json`:
   ```json
   {
     "id": "my_domain",
     "filename": "my_domain.md",
     "priority": "HIGH",
     "domain": "my_domain",
     "keywords": ["keyword1", "keyword2"],
     "module_types": ["all"],
     "search_weight": 0.85
   }
   ```
3. Update mappings (domain_mapping, module_type_mapping, standards_coverage, code_pattern_index)

## Best Practices

- **Keywords**: Hyphenated format — `buffer-overflow`, `CRC-verification`, `state-machine`
- **Priority**: CRITICAL (safety-critical), HIGH (recommended), MEDIUM (reference), LOW (optional)
- **Search_weight**: 1.0 (definitive), 0.9-0.8 (highly relevant), 0.7 (good reference)
- **Module_types**: Match actual firmware modules (temp_sensor, logger, comm, ota, all)
- **Context_limit**: ~2000 tokens per query (~1500 words)
