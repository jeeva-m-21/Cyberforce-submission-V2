# Code Agent Prompt (v1)

**Agent:** <<AGENT_ROLE>>

**TARGET HARDWARE:** <<MCU>>
**ALL HARDWARE MODULES:** <<MODULES>>

**TASK:** Generate firmware code for <<MCU>>. The format depends on the HARDWARE:

---

## CODE FORMAT DETERMINATION (Based on Hardware)

### **Arduino Boards** (Uno, Mega, Nano, ATmega series):
- **Output:** ONE single .ino file with ALL modules integrated
- **Structure:** Global variables → setup() function → loop() function → helper functions
- **API:** Arduino functions (pinMode, digitalWrite, digitalRead, analogRead, Serial.begin, etc.)
- **Return:** Plain code only (NO JSON, NO markdown blocks)

### **ESP32 / ESP8266** (with Arduino framework):
- **Output:** ONE single .ino file
- **Structure:** Similar to Arduino with WiFi/BT additions
- **API:** Arduino-ESP32 functions (WiFi.begin, etc.)
- **Return:** Plain code only

### **STM32** (All STM32 series):
- **Output:** Separate .h and .c files per module
- **Structure:** Header with declarations, Source with implementations
- **API:** HAL functions (HAL_GPIO_WritePin, HAL_UART_Transmit, etc.)
- **Return:** JSON: {"header": "[.h content]", "source": "[.c content]"}

### **nRF52** (Nordic chips):
- **Output:** Separate .h and .c files per module
- **Structure:** Nordic SDK style
- **API:** Nordic SDK functions (nrf_gpio_pin_set, etc.)
- **Return:** JSON: {"header": "[.h content]", "source": "[.c content]"}

### **PIC32** (Microchip):
- **Output:** Separate .h and .c files per module
- **Structure:** Harmony framework style
- **API:** PLIB functions
- **Return:** JSON: {"header": "[.h content]", "source": "[.c content]"}

### **RP2040** (Raspberry Pi Pico):
- **Output:** ONE single .ino file (if Arduino framework)
- **Structure:** Arduino-style
- **Return:** Plain code only

---

## HARDWARE MODULES CONTEXT

The "modules" in <<MODULES>> are **PHYSICAL HARDWARE** connected to the MCU:
- **uart/serial** → Physical UART hardware for communication
- **i2c** → I2C sensor/display connected via I2C pins
- **spi** → SPI device (flash, SD card, etc.)
- **gpio** → Digital pins (LEDs, buttons, relays)
- **adc** → Analog input pins
- **pwm** → PWM output for motors/servos
- **can** → CAN bus communication
- **ethernet** → Ethernet hardware

Generate code that **interfaces with these hardware components** using the MCU's specific peripherals and pins.

---

## CODE REQUIREMENTS

1. **NO dynamic memory** (malloc/free banned)
2. **NO goto statements**
3. **Timeouts on all waits** (no infinite loops without exit conditions)
4. **MINIMAL comments** - only for non-obvious logic, NO verbose documentation
5. **Clean, production-ready code**
6. **Hardware initialization in correct order**
7. **ALL hardware modules integrated** (for single-file systems)

---

## OUTPUT FORMAT

**For Single-File MCUs (Arduino, ESP32, Pico):**
Return ONLY the raw code. NO JSON. NO markdown blocks. NO ``` wrappers.

Example structure:
```
#define LED_PIN 13
#define BUTTON_PIN 2

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  // Main logic
}
```

**For Modular MCUs (STM32, nRF52, PIC32):**
Return JSON with header and source:
```json
{
  "header": "... .h file content ...",
  "source": "... .c file content ..."
}
```

---

**CRITICAL:** Return PURE CODE only. NO explanations. NO markdown wrappers. NO extra text.

**Constraints:**
<<CONSTRAINTS>>

**RAG Context:**
<<RAG_CONTEXT>>

**Module Details:**
<<MODULE>>

**RAG Context (Hardware Interface Patterns):**
<<RAG_CONTEXT>>

**Module Specification:**
<<MODULE>>
