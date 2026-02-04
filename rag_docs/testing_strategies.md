# Testing Strategies for Embedded Firmware

## Unit Testing Framework

### Minimal Test Framework (No External Dependencies)
```c
#define TEST_PASS 0
#define TEST_FAIL 1

typedef struct {
    const char *name;
    int (*test_fn)(void);
    int result;
} test_case_t;

int g_tests_passed = 0;
int g_tests_failed = 0;

#define ASSERT_EQ(actual, expected) \
    if ((actual) != (expected)) { \
        printf("FAIL: %s:%d: %d != %d\n", \
               __FILE__, __LINE__, actual, expected); \
        return TEST_FAIL; \
    }

#define ASSERT_NE(actual, not_expected) \
    if ((actual) == (not_expected)) { \
        printf("FAIL: %s:%d: %d == %d\n", \
               __FILE__, __LINE__, actual, not_expected); \
        return TEST_FAIL; \
    }

#define ASSERT_TRUE(expr) \
    if (!(expr)) { \
        printf("FAIL: %s:%d: assertion false\n", __FILE__, __LINE__); \
        return TEST_FAIL; \
    }

#define ASSERT_NULL(ptr) \
    if ((ptr) != NULL) { \
        printf("FAIL: %s:%d: pointer not NULL\n", __FILE__, __LINE__); \
        return TEST_FAIL; \
    }

void run_test(test_case_t *test) {
    printf("Running: %s...", test->name);
    test->result = test->test_fn();
    if (test->result == TEST_PASS) {
        printf(" PASS\n");
        g_tests_passed++;
    } else {
        printf(" FAIL\n");
        g_tests_failed++;
    }
}
```

### Mock/Stub Pattern
```c
// Real function (hardware-dependent)
uint16_t hw_read_sensor(void) {
    return ADC_READ();
}

// Stub for testing (overrideable)
#ifdef UNIT_TEST
    uint16_t g_sensor_stub_value = 0;
    uint16_t hw_read_sensor(void) {
        return g_sensor_stub_value;
    }
#endif

// Test code
int test_sensor_filtering(void) {
    g_sensor_stub_value = 100;
    uint16_t filtered = sensor_filter_value(hw_read_sensor());
    ASSERT_EQ(filtered, 100);
    
    g_sensor_stub_value = 200;
    filtered = sensor_filter_value(hw_read_sensor());
    ASSERT_EQ(filtered, 150);  // Average with previous
    
    return TEST_PASS;
}
```

## Integration Testing

### Circular Buffer Test
```c
int test_ring_buffer_put_get(void) {
    ring_buffer_t buf;
    ring_buffer_init(&buf, 10);
    
    // Test single put/get
    uint8_t data = 42;
    ring_buffer_put(&buf, data);
    uint8_t result;
    int status = ring_buffer_get(&buf, &result);
    
    ASSERT_EQ(status, 0);  // Success
    ASSERT_EQ(result, 42);
    
    return TEST_PASS;
}

int test_ring_buffer_overflow(void) {
    ring_buffer_t buf;
    ring_buffer_init(&buf, 3);
    
    // Fill buffer
    ring_buffer_put(&buf, 1);
    ring_buffer_put(&buf, 2);
    ring_buffer_put(&buf, 3);
    
    // Try to overflow
    int status = ring_buffer_put(&buf, 4);
    ASSERT_EQ(status, ERR_BUFFER_FULL);
    
    return TEST_PASS;
}
```

## Hardware-in-the-Loop (HIL) Testing

### Simulated Sensor Data
```c
typedef struct {
    uint16_t values[100];
    uint8_t index;
    uint8_t size;
} sim_sensor_t;

sim_sensor_t sim_sensor = {
    .values = {100, 101, 102, 103, 104},
    .size = 5,
    .index = 0
};

uint16_t sim_read_sensor(void) {
    if (sim_sensor.index >= sim_sensor.size) {
        sim_sensor.index = 0;  // Wrap around
    }
    return sim_sensor.values[sim_sensor.index++];
}

int test_sensor_sequence(void) {
    uint16_t val1 = sim_read_sensor();
    uint16_t val2 = sim_read_sensor();
    uint16_t val3 = sim_read_sensor();
    
    ASSERT_EQ(val1, 100);
    ASSERT_EQ(val2, 101);
    ASSERT_EQ(val3, 102);
    
    return TEST_PASS;
}
```

## State Machine Testing

### FSM Transition Verification
```c
int test_fsm_idle_to_init(void) {
    fsm_context_t ctx;
    fsm_init(&ctx);
    
    ASSERT_EQ(ctx.current_state, STATE_IDLE);
    
    error_code_t result = fsm_process_event(&ctx, EVENT_START);
    ASSERT_EQ(result, ERR_OK);
    ASSERT_EQ(ctx.current_state, STATE_INITIALIZING);
    
    return TEST_PASS;
}

int test_fsm_invalid_transition(void) {
    fsm_context_t ctx;
    fsm_init(&ctx);
    
    // Try invalid event in IDLE state
    error_code_t result = fsm_process_event(&ctx, EVENT_SENSOR_READY);
    ASSERT_EQ(result, ERR_INVALID_STATE);
    ASSERT_EQ(ctx.current_state, STATE_IDLE);  // No change
    
    return TEST_PASS;
}

int test_fsm_error_recovery(void) {
    fsm_context_t ctx;
    fsm_init(&ctx);
    
    // Cause error
    fsm_process_event(&ctx, EVENT_START);
    fsm_process_event(&ctx, EVENT_ERROR);
    ASSERT_EQ(ctx.current_state, STATE_ERROR);
    
    // Recover
    error_code_t result = fsm_process_event(&ctx, EVENT_STOP);
    ASSERT_EQ(ctx.current_state, STATE_IDLE);
    
    return TEST_PASS;
}
```

## Memory Safety Testing

### Stack Overflow Detection
```c
int test_stack_depth(void) {
    void recursion_helper(int depth) {
        if (depth > 100) {
            printf("FAIL: Stack depth exceeded 100\n");
            return TEST_FAIL;
        }
        // Check canary pattern
        extern uint32_t __stack_limit;
        if (*(uint32_t *)&__stack_limit != STACK_CANARY_PATTERN) {
            printf("FAIL: Stack overflow detected\n");
            return TEST_FAIL;
        }
        recursion_helper(depth + 1);
    }
    
    recursion_helper(0);
    return TEST_PASS;
}

int test_buffer_bounds(void) {
    uint8_t buf[10];
    
    // Test safe write
    safe_write_buffer(buf, 5, 42);
    ASSERT_EQ(buf[5], 42);
    
    // Test out-of-bounds (should not crash)
    safe_write_buffer(buf, 15, 99);  // Out of bounds
    ASSERT_NE(buf[15], 99);  // Should not have written
    
    return TEST_PASS;
}
```

## Timing & Performance Tests

### Execution Time Measurement
```c
typedef struct {
    uint32_t start_time;
    uint32_t end_time;
    uint32_t duration_us;
} timing_t;

uint32_t get_microseconds(void) {
    return HAL_GetTick() * 1000;  // Simplified
}

int test_sensor_read_timing(void) {
    timing_t timing;
    
    timing.start_time = get_microseconds();
    uint16_t value = sensor_read_value();
    timing.end_time = get_microseconds();
    timing.duration_us = timing.end_time - timing.start_time;
    
    // Verify timing requirement (< 10ms)
    ASSERT_TRUE(timing.duration_us < 10000);
    printf("Sensor read: %lu us\n", timing.duration_us);
    
    return TEST_PASS;
}

int test_isr_latency(void) {
    volatile uint32_t isr_entry_time = 0;
    uint32_t test_start = get_microseconds();
    
    // Trigger interrupt
    trigger_isr();
    
    // ISR should fire within 100us
    ASSERT_TRUE(isr_entry_time > 0);
    ASSERT_TRUE((isr_entry_time - test_start) < 100);
    
    return TEST_PASS;
}
```

## CRC & Checksum Testing

### CRC Verification
```c
int test_crc16_calculation(void) {
    uint8_t data[] = {0x01, 0x02, 0x03, 0x04};
    uint16_t crc = crc16_calculate(data, 4);
    
    // Known good CRC value
    uint16_t expected = 0x1234;  // Pre-calculated
    ASSERT_EQ(crc, expected);
    
    return TEST_PASS;
}

int test_crc_corruption_detection(void) {
    uint8_t data[] = {0x01, 0x02, 0x03, 0x04};
    uint16_t crc = crc16_calculate(data, 4);
    
    // Corrupt data
    data[2] = 0xFF;
    uint16_t corrupted_crc = crc16_calculate(data, 4);
    
    ASSERT_NE(crc, corrupted_crc);
    
    return TEST_PASS;
}
```

## Test Runner

### Unified Test Execution
```c
int main(void) {
    printf("=== Embedded Firmware Test Suite ===\n\n");
    
    test_case_t tests[] = {
        {"RingBuffer Put/Get", test_ring_buffer_put_get},
        {"RingBuffer Overflow", test_ring_buffer_overflow},
        {"FSM Idle->Init", test_fsm_idle_to_init},
        {"FSM Invalid Event", test_fsm_invalid_transition},
        {"FSM Error Recovery", test_fsm_error_recovery},
        {"Sensor Timing", test_sensor_read_timing},
        {"CRC Calculation", test_crc16_calculation},
        {NULL, NULL}
    };
    
    for (int i = 0; tests[i].name != NULL; i++) {
        run_test(&tests[i]);
    }
    
    printf("\n=== Results ===\n");
    printf("Passed: %d\n", g_tests_passed);
    printf("Failed: %d\n", g_tests_failed);
    
    return (g_tests_failed > 0) ? 1 : 0;
}
```

## Coverage & Mutation Testing

### Code Coverage Tracking
```c
#ifdef COVERAGE
    int g_coverage_bitmap[256];  // Bitmap of executed lines
    #define COVERAGE_MARK(line) g_coverage_bitmap[(line) / 8] |= (1 << ((line) % 8))
#else
    #define COVERAGE_MARK(line)
#endif

// In each function:
void process_data(uint8_t *data) {
    COVERAGE_MARK(__LINE__);
    if (data == NULL) {
        COVERAGE_MARK(__LINE__);
        return;
    }
    // ...
}
```
