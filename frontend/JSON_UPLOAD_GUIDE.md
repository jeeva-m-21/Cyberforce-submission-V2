# CyberForge-26 UI - JSON Configuration Guide

## Uploading JSON Configurations

The JSON upload feature allows you to quickly load pre-configured firmware specifications into the UI.

### Required Fields

```json
{
  "project_name": "Your Project Name",
  "target_platform": "STM32F407",
  "modules": [
    {
      "name": "Module Name",
      "type": "uart",
      "parameters": {}
    }
  ]
}
```

### Full Example

Download the `example-config.json` file from the frontend directory for a complete working example with all fields:

```json
{
  "project_name": "Motor Controller v2",
  "description": "High-performance motor control system",
  "target_platform": "STM32F407",
  "modules": [
    {
      "name": "UART_DEBUG",
      "type": "uart",
      "description": "Debug communication",
      "parameters": {
        "baudrate": 115200,
        "data_bits": 8,
        "parity": "none",
        "stop_bits": 1,
        "pins": {
          "tx": "PA9",
          "rx": "PA10"
        },
        "interrupt": true
      }
    }
  ],
  "requirements": [
    "Real-time response < 1ms",
    "Operating temperature -20°C to 70°C"
  ],
  "constraints": {
    "max_flash": 1048576,
    "max_ram": 196608
  },
  "safety_critical": false,
  "optimization_goal": "balanced"
}
```

### Supported Module Types

- **Communication**: uart, spi, i2c, can, ethernet, usb
- **Sensors**: temperature, pressure, accelerometer, gyroscope
- **Actuators**: motor, servo, relay
- **Storage**: flash, eeprom, sdcard
- **Other**: adc, dac, pwm, timer, watchdog

### Debugging

1. Open browser console (F12)
2. Try uploading your JSON file
3. Check console for detailed error messages
4. Error messages will show what fields are missing or invalid

### To Upload

1. Click the **"Upload JSON"** button
2. Select your .json configuration file
3. You'll see a success message with module count
4. The form will populate automatically

### To Download

1. Fill in your configuration in the form
2. Click **"Download JSON"** button
3. Your browser will save the configuration as JSON
4. Use this file to import later or share with others
