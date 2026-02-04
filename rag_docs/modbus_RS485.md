# Modbus RS485 Protocol Implementation

## Protocol Overview

### Modbus RTU Frame Structure
- Start (silence) → Slave ID → Function Code → Data → CRC-16 → End (silence)
- No checksums or error-correcting codes beyond CRC
- Minimum 3.5 character times between frames

### Typical Baud Rates
- 9600, 19200, 38400 bps
- Ensure consistent baud rate across all devices
- Add handshake delays (50-100ms) between master/slave

## Safe Implementation Pattern

### Register Mapping
```c
#define MODBUS_REG_TEMP_HI      0x0000  // Temperature high byte
#define MODBUS_REG_TEMP_LO      0x0001  // Temperature low byte
#define MODBUS_REG_STATUS       0x0002  // Device status flags
#define MODBUS_MAX_REGISTERS    100
```

### CRC-16 Verification
- Always validate CRC before processing frame
- Discard frames with invalid CRC
- Log CRC errors for diagnostics

### Timing Constraints
- Inter-frame delay: 3.5 character times minimum
- Timeout: wait 1.5-2 seconds for response
- Retry: 3 attempts before marking slave offline

## Common Pitfalls

1. **Endianness**: Modbus uses big-endian byte order
   - Swap bytes when interfacing with little-endian MCUs
   
2. **Silent Failures**: Don't ignore CRC or timeout errors
   - Log all communication failures with timestamp
   
3. **Buffer Overflow**: Limit frame size to 256 bytes
   - Validate slave ID and function code before processing

## OTA Considerations

- Use Modbus function 16 (Write Multiple Registers) for firmware chunks
- Implement checksum verification at application layer
- Maintain rollback capability (store previous firmware in secondary flash)
