# Build Agent Prompt (v1)

**Agent:** <<AGENT_ROLE>>

**Task:** ATTEMPT TO ACTUALLY COMPILE the generated firmware code and produce a comprehensive build log with compilation status, errors, warnings, and build artifacts.

**Target MCU:** <<MCU>>
**Generated Code Files:** <<CODE_FILES>>
**Project Requirements:** <<MODULE>>

**Build Process Steps:**

1. **Environment Detection:**
   - Detect available compilers:
     - Arduino: arduino-cli or avr-gcc for Uno
     - ARM: arm-none-eabi-gcc for STM32, nRF52
     - ESP32: xtensa-esp32-elf-gcc
     - PIC: xc32-gcc
   - If no compiler found, report "Compiler not available" with installation instructions

2. **Compilation Attempt:**
   - For Arduino Uno (.ino files):
     - Try: `arduino-cli compile --fqbn arduino:avr:uno [sketch_dir]`
     - Or: `avr-gcc -mmcu=atmega328p -DF_CPU=16000000UL -Os [files] -o firmware.elf`
   
   - For ARM MCUs (.c/.h files):
     - Try: `arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb [files] -o firmware.elf`
   
   - For ESP32:
     - Try: `idf.py build` or `arduino-cli compile --fqbn esp32:esp32:esp32`

3. **Capture ALL Output:**
   - Capture stdout and stderr
   - Parse compilation errors
   - Extract warnings
   - Record success/failure status
   - Measure compilation time
   - Calculate binary size if successful

4. **Generate Detailed Build Log:**

**Output Format (JSON):**
```json
{
  "build_summary": {
    "status": "success" | "failed" | "no_compiler" | "partial_success",
    "timestamp": "2024-01-15T10:30:00Z",
    "mcu_target": "Arduino Uno",
    "compiler": "avr-gcc 7.3.0",
    "build_time_seconds": 2.5,
    "total_files": 3,
    "compiled_files": 3,
    "errors_count": 0,
    "warnings_count": 2
  },
  "compilation_steps": [
    {
      "step": 1,
      "action": "Compile main.c",
      "command": "avr-gcc -mmcu=atmega328p main.c -o main.o",
      "status": "success",
      "duration_ms": 150,
      "output": ""
    },
    {
      "step": 2,
      "action": "Link firmware",
      "command": "avr-gcc main.o uart.o -o firmware.elf",
      "status": "success",
      "duration_ms": 80,
      "output": ""
    }
  ],
  "errors": [
    {
      "file": "uart_module.c",
      "line": 45,
      "column": 12,
      "severity": "error",
      "message": "undefined reference to 'Serial'",
      "code": "C2065",
      "suggestion": "Include <Arduino.h> or use USART registers directly"
    }
  ],
  "warnings": [
    {
      "file": "main.c",
      "line": 23,
      "severity": "warning",
      "message": "unused variable 'counter'",
      "code": "W0612"
    }
  ],
  "binary_info": {
    "hex_file": "firmware.hex",
    "elf_file": "firmware.elf",
    "flash_size_bytes": 3240,
    "flash_usage_percent": 10.1,
    "ram_size_bytes": 456,
    "ram_usage_percent": 22.3,
    "eeprom_usage_bytes": 0
  },
  "artifacts": [
    {
      "type": "hex",
      "path": "build/firmware.hex",
      "size_bytes": 3240,
      "checksum": "a3f5d..."
    },
    {
      "type": "elf",
      "path": "build/firmware.elf",
      "size_bytes": 12450
    }
  ],
  "recommendations": [
    "Remove unused variable 'counter' in main.c:23",
    "Flash usage is optimal at 10.1%",
    "Consider enabling optimization flags: -Os"
  ],
  "upload_instructions": {
    "method": "avrdude",
    "command": "avrdude -p atmega328p -c arduino -P /dev/ttyUSB0 -U flash:w:firmware.hex",
    "baud_rate": 115200
  }
}
```

**If Compilation Fails:**
- Still generate the build log
- Include ALL error messages with context
- Provide specific recommendations to fix each error
- Suggest alternative approaches
- Status should be "failed" with detailed error analysis

**If No Compiler Available:**
- Status: "no_compiler"
- Include installation instructions for the target MCU's toolchain
- Provide mock compilation analysis based on code inspection

**Constraints:**
<<CONSTRAINTS>>

**RAG Context:**
<<RAG_CONTEXT>>

**Modules:**
<<MODULE>>
