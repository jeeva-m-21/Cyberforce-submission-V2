# Architecture Agent Prompt (v1)

**Agent:** <<AGENT_ROLE>>

**Task:** Produce a comprehensive, well-structured firmware architecture document in **Markdown format** (.md file). The architecture must be tailored to the specific MCU and hardware modules specified in the project requirements.

**MCU Board Information:**
- Target MCU: <<MCU>>
- Optimization Goal: <<OPTIMIZATION>>
- Board Specifications: <<BOARD_SPECS>>

**Output Requirements:**
1. **Format:** Output MUST be in Markdown format with proper headings, tables, and code blocks
2. **Structure:** Include the following sections:
   - # Project Overview (name, MCU target, optimization goals)
   - ## Hardware Architecture (MCU specs, memory layout, peripherals available)
   - ## Module Breakdown (table with module names, types, responsibilities, interfaces)
   - ## System Architecture Diagram (ASCII art or Mermaid diagram)
   - ## Memory Map (Flash/RAM allocation per module)
   - ## Communication Interfaces (how modules interact)
   - ## Safety & Constraints (MISRA-C rules, safety requirements)
   - ## Build & Deployment Strategy
3. **Hardware Module Mapping:** For each hardware module specified (UART, I2C, SPI, etc.), define:
   - Physical pins on the MCU
   - Initialization parameters
   - Communication protocol details
   - Expected behavior
4. **MCU-Specific Details:** Tailor the architecture to the target MCU characteristics:
   - Arduino Uno: ATmega328P architecture, 32KB Flash, 2KB RAM, 1KB EEPROM
   - STM32L476: ARM Cortex-M4, 1MB Flash, 128KB RAM, low-power features
   - ESP32: Dual-core, WiFi/BT, 4MB Flash, 520KB RAM
   - nRF52840: ARM Cortex-M4, BLE 5.0, 1MB Flash, 256KB RAM
   - PIC32MZ: MIPS-based, 2MB Flash, 512KB RAM

**Constraints:**
<<CONSTRAINTS>>

**RAG Context:**
<<RAG_CONTEXT>>

**Project Specification:**
<<MODULE>>

**Output Format Example:**
```markdown
# Firmware Architecture for [Project Name]

## Project Overview
- **MCU Target:** [MCU Name]
- **Optimization:** [Performance/Size/Balanced]
- **Description:** [Brief description]

## Hardware Architecture
### MCU Specifications
| Property | Value |
|----------|-------|
| CPU | [Architecture] |
| Flash | [Size] |
| RAM | [Size] |

## Module Breakdown
| Module | Type | Pins | Responsibility |
|--------|------|------|----------------|
| [Name] | UART | TX:D1, RX:D0 | Serial communication |

... (continue with all sections)
```
