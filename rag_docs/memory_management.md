# Memory Management & Heap Safety

## Embedded Systems Memory Model

### Typical MCU Memory Architecture
```
Flash (Code Storage):
  0x00000000 - Bootloader (4-8KB)
  0x00002000 - Application Code
  0x00040000 - Read-Only Data (constants, LUTs)

SRAM (Runtime Memory):
  0x20000000 - Stack (grows down)
  0x20000xxx - Heap (grows up)
  0x20007FFF - End of SRAM (for 32KB device)

EEPROM (Non-Volatile Data):
  0x00800000 - Persistent Configuration
```

### Memory Constraints
- **Flash**: Limited write cycles (1000-10,000 depending on tech)
- **SRAM**: Volatile, lost on power loss
- **EEPROM**: Slower, limited cycles, limited size
- **Total**: Typically 8KB-2MB combined (vs GBs in desktop systems)

## Static Allocation (PREFERRED for Embedded)

### Rule: Avoid malloc() in Embedded Firmware
**Reason**: Dynamic allocation leads to fragmentation and unpredictable timing.

```c
// GOOD: Static allocation (compile-time sized)
#define BUFFER_SIZE 256
#define QUEUE_DEPTH 10

typedef struct {
    uint8_t buffer[BUFFER_SIZE];
    uint16_t head;
    uint16_t tail;
} ring_buffer_t;

ring_buffer_t sensor_buffer;  // Global, statically allocated

// BAD: Dynamic allocation
uint8_t *buffer = malloc(BUFFER_SIZE);  // Forbidden in firmware
```

### Static Array Pattern
```c
// Define maximum sizes at compile time
#define MAX_SENSORS 4
#define MAX_READINGS 100

typedef struct {
    uint16_t readings[MAX_READINGS];
    uint8_t count;
} sensor_history_t;

sensor_history_t histories[MAX_SENSORS];  // All memory reserved at startup

// Initialize
void init_sensors(void) {
    for (int i = 0; i < MAX_SENSORS; i++) {
        histories[i].count = 0;
    }
}
```

## Stack vs Heap

### Stack (Safe for Embedded)
- Automatic, LIFO allocation
- Very fast (single pointer increment)
- Automatic cleanup on function exit
- Limited size (MCU-specific, usually 1-4KB)
- Can overflow if too much data allocated

```c
void process_data(void) {
    uint8_t local_buffer[256];  // Stack-allocated
    uint16_t values[10];        // Safe, auto-freed on return
    // Use values
}  // Automatically freed
```

### Heap (Dangerous for Embedded)
- Dynamic allocation (malloc/free)
- Slow, complex free-list management
- Memory fragmentation risk
- Unpredictable timing
- **FORBIDDEN in safety-critical firmware**

```c
// AVOID THIS in embedded systems
uint8_t *ptr = malloc(256);    // Unpredictable timing
if (ptr == NULL) { /* handle */ }
// ... use ptr ...
free(ptr);  // May cause fragmentation
```

## Global vs Local Variables

### Global Variables (Use Sparingly)
```c
// Global: persists for program lifetime
volatile uint16_t sensor_value = 0;

// Bad: implicit state, hard to test
uint8_t state = 0;  // What does this state track?

// Good: explicit documentation
volatile enum {
    STATE_INIT,
    STATE_READY,
    STATE_MEASURING,
    STATE_ERROR
} device_state = STATE_INIT;
```

### Local Variables (Preferred)
```c
void measure_sensor(void) {
    uint16_t reading;      // Function-scoped
    uint16_t avg = 0;
    
    for (int i = 0; i < 10; i++) {
        reading = ADC_READ();
        avg += reading;
    }
    return avg / 10;
}  // reading, avg automatically freed
```

## Stack Size Calculation

### Estimating Required Stack
```c
// Worst-case stack usage = deepest call chain + locals

// Example: 3-level call stack
main() 
  -> process_sensor()    (32 bytes locals)
    -> filter_data()     (24 bytes locals)
      -> compute_avg()   (16 bytes locals)
  + Return addresses (4 bytes each * 3 = 12 bytes)
  + Saved registers (varies by architecture)
  = ~100 bytes minimum
  * Safety factor of 2-3x = 200-300 bytes recommended
```

### Detecting Stack Overflow
```c
// Method 1: Check SP (Stack Pointer) at runtime
if (SP < STACK_MINIMUM) {
    error_handler(ERR_STACK_OVERFLOW);
}

// Method 2: Fill stack with pattern and check
#define STACK_CANARY_PATTERN 0xDEADBEEF
void check_stack_canary(void) {
    extern uint32_t __stack_limit;
    if (*(uint32_t *)&__stack_limit != STACK_CANARY_PATTERN) {
        fatal_error();  // Stack overflowed
    }
}
```

## Pool Allocation (Safe Alternative to malloc)

### Fixed-Size Pool Pattern
```c
#define POOL_SIZE 10
#define BLOCK_SIZE 64

typedef struct {
    uint8_t blocks[POOL_SIZE][BLOCK_SIZE];
    uint8_t allocated[POOL_SIZE];  // Bitmap
} memory_pool_t;

memory_pool_t msg_pool;

void *pool_alloc(void) {
    for (int i = 0; i < POOL_SIZE; i++) {
        if (!msg_pool.allocated[i]) {
            msg_pool.allocated[i] = 1;
            return msg_pool.blocks[i];
        }
    }
    return NULL;  // Pool exhausted
}

void pool_free(void *ptr) {
    int idx = ((uint8_t *)ptr - msg_pool.blocks[0]) / BLOCK_SIZE;
    if (idx >= 0 && idx < POOL_SIZE) {
        msg_pool.allocated[idx] = 0;
    }
}
```

## Memory Initialization

### Proper Startup Sequence
```c
void main(void) {
    // 1. Initialize RAM (data, BSS)
    // (done by startup code before main)
    
    // 2. Initialize hardware
    init_clock();
    init_uart();
    init_adc();
    
    // 3. Initialize BSS (zero-initialized globals)
    memset(&__bss_start, 0, (size_t)&__bss_size);
    
    // 4. Initialize data (copy from flash to RAM)
    memcpy(&__data_start, &__data_flash_start, 
           (size_t)&__data_size);
    
    // 5. Run application
    while (1) {
        app_loop();
    }
}
```

## Linker Script Memory Declaration

### GCC ARM Linker Script Snippet
```ld
MEMORY {
    FLASH (rx)  : ORIGIN = 0x00000000, LENGTH = 256K
    RAM (rwx)   : ORIGIN = 0x20000000, LENGTH = 32K
    EEPROM (r)  : ORIGIN = 0x00800000, LENGTH = 1K
}

SECTIONS {
    .text : { *(.text*) } > FLASH
    .rodata : { *(.rodata*) } > FLASH
    .data : { *(.data*) } > RAM AT > FLASH
    .bss : { *(.bss*) } > RAM
    
    __stack_top = ORIGIN(RAM) + LENGTH(RAM);
    __heap_start = ORIGIN(RAM) + 0x1000;
}
```

## Optimization: Const & Flash Storage

### Storing Data in Flash (Read-Only)
```c
// Store LUT in flash, not RAM
const uint16_t sine_lut[256] = {
    0, 402, 804, 1206, ...  // 256 * 2 bytes = 512B in flash
};

// Access from flash (compiler handles addressing)
uint16_t sin_approx = sine_lut[angle];

// Good: no RAM consumption
// Cost: slightly slower access (flash latency)
```

## Memory Leak Detection

### Simple Leak Checking
```c
#ifdef DEBUG
    #define malloc(size) debug_malloc((size), __FILE__, __LINE__)
    #define free(ptr) debug_free((ptr), __FILE__, __LINE__)
    
    void *debug_malloc(size_t size, const char *file, int line) {
        void *ptr = real_malloc(size);
        log_alloc(ptr, size, file, line);
        return ptr;
    }
#endif
```
