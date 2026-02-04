# Secure OTA Firmware Update Patterns

## OTA Architecture Overview

### Three-Stage Update Process
1. **Download Stage**: Receive firmware chunks, verify integrity
2. **Validation Stage**: Check signature, version, compatibility
3. **Install Stage**: Atomic swap (dual-partition or bootloader-assisted)

## Safe Firmware Versioning

```c
typedef struct {
    uint32_t version_major;
    uint32_t version_minor;
    uint32_t build_number;
    uint32_t timestamp;
    uint8_t  sha256_hash[32];
} firmware_header_t;
```

### Version Comparison
- Always check for version compatibility (no rollback to older unsafe versions)
- Maintain a "minimum acceptable version" in secure storage
- Log all OTA attempts with version info

## Integrity Checking

### SHA-256 Verification
- Compute hash over firmware payload (excluding header/signature)
- Compare against embedded hash before installation
- Abort OTA if hash mismatch detected

### Rollback Protection
- Store previous firmware hash in non-volatile memory
- Prevent installation of old firmware versions
- Use monotonic counter to track update sequence

## Encryption & Authentication

### Recommended Flow
1. Sign firmware with private key (RSA-2048 or ECDSA)
2. Encrypt firmware chunks with AES-256-CBC
3. Verify signature before decryption
4. Abort on any crypto failure

### Key Management
- Store public keys in read-only flash (part of bootloader)
- Never allow key updates over wireless/network
- Use secure boot to verify bootloader integrity

## Flash Layout (Dual Partition Pattern)

```
Boot Partition:  Bootloader (immutable)
Active Partition: Current firmware (executable)
Update Partition: New firmware staging area
Config Partition: Version, keys, rollback state
```

### Swap Logic
```c
if (validate_new_firmware()) {
    disable_interrupts();
    swap_partitions();  // Atomic operation
    update_metadata();
    reboot();
}
```

## Common OTA Failures

1. **Incomplete Download**: Partial firmware in flash
   - Solution: Use chunked transfer with retry per chunk
   
2. **Power Loss**: Update interrupted mid-flash
   - Solution: Use watchdog timer, atomic operations
   
3. **Signature Bypass**: Accepting unsigned firmware
   - Solution: Crypto verification MANDATORY before install

## Testing OTA

- Simulate power loss at each stage
- Test with corrupted firmware images
- Verify rollback to stable version
- Log all OTA operations with timestamps
