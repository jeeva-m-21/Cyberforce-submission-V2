# Interrupt Handling & Real-Time Execution

## ISR (Interrupt Service Routine) Design Principles

### Mandatory Constraints for ISR Safety
- **CRITICAL**: ISRs must be deterministic and have bounded execution time
- **CRITICAL**: No dynamic memory allocation in ISR context
- **CRITICAL**: Minimize context switching overhead
- All ISRs must have documented worst-case execution time (WCET)

### ISR Structure Pattern
```c
// Global volatile flag for ISR-to-main communication
volatile uint8_t g_sensor_ready = 0;
volatile uint16_t g_sensor_value = 0;

// ISR: must be fast, set flags, avoid calls
void ADC_ISR(void) {
    g_sensor_value = ADC_READ_RESULT();
    g_sensor_ready = 1;  // Signal to main loop
    // NO function calls, NO malloc, NO I/O
}

// Main loop polls flag and processes data
void main_loop(void) {
    if (g_sensor_ready) {
        process_sensor(g_sensor_value);
        g_sensor_ready = 0;
    }
}
```

### Critical ISR Rules
1. **Keep it SHORT**: Maximum 10-20 CPU cycles
2. **Volatile keyword**: Mark all shared variables volatile
3. **Atomic operations**: Use atomic read/write for flags
4. **No nesting**: Disable interrupts if accessing shared state
5. **No printf/debug**: Logging in ISR causes deadlock risk

### Interrupt Prioritization
```c
// Higher number = higher priority (MCU-specific)
// Timer ISR: priority 1 (highest, time-critical)
// UART ISR: priority 2 (medium, must not miss characters)
// GPIO ISR: priority 3 (lower, can tolerate latency)

HAL_NVIC_SetPriority(TIM3_IRQn, 1, 0);
HAL_NVIC_SetPriority(USART1_IRQn, 2, 0);
HAL_NVIC_SetPriority(EXTI0_IRQn, 3, 0);
```

## Shared Data & Race Conditions

### Safe Flag Pattern
```c
// For single-byte flags: use volatile, no locks needed
volatile uint8_t flag = 0;

// ISR: atomic write (single instruction)
void ISR(void) {
    flag = 1;
}

// Main: read and clear
uint8_t was_triggered = flag;
flag = 0;
```

### Multi-Word Data Pattern (Requires Protection)
```c
// Use critical section for compound operations
typedef struct {
    uint16_t count;
    uint32_t timestamp;
} sensor_data_t;

volatile sensor_data_t data;

// In main (before enabling interrupts):
__disable_irq();
sensor_data_t snapshot = data;
__enable_irq();
// Now use snapshot safely
```

## Timer Interrupts for Periodic Tasks

### FreeRTOS Timer Example
```c
// Create timer with period 100ms
xTimerHandle timer = xTimerCreate(
    "sensor_timer",
    pdMS_TO_TICKS(100),
    pdTRUE,  // Auto-reload
    NULL,
    sensor_timer_callback
);

void sensor_timer_callback(xTimerHandle xTimer) {
    // This runs in timer task context (safe for queues/semaphores)
    xQueueSendFromISR(sensor_queue, &sensor_data, NULL);
}
```

### Bare-Metal Timer Example (STM32)
```c
// Timer configured in NVIC with priority 1
void TIM3_IRQHandler(void) {
    if (TIM3->SR & TIM_SR_UIF) {
        TIM3->SR &= ~TIM_SR_UIF;  // Clear flag FIRST
        g_timer_tick++;
        // Time-critical work only
    }
}
```

## Watchdog Timer Integration

### Watchdog Pattern for Safety
```c
// Initialize watchdog with 1-second timeout
IWDG_Start(1000);  // 1000ms

// In main loop (must pet watchdog regularly)
void main(void) {
    while (1) {
        execute_task();
        IWDG_Feed();  // Reset timer
        // If execution exceeds 1s, watchdog resets MCU
    }
}
```

## Avoiding Interrupt Conflicts

### Critical Section Pattern
```c
// Disable all interrupts for atomic operation
uint32_t primask = __get_PRIMASK();
__disable_irq();

// Atomic section (no interrupts)
shared_buffer[index] = value;
index++;

__set_PRIMASK(primask);  // Restore original state
```

### Semaphore Pattern (FreeRTOS)
```c
SemaphoreHandle_t data_ready = xSemaphoreCreateBinary();

// ISR: signal
void ISR(void) {
    xSemaphoreGiveFromISR(data_ready, NULL);
}

// Task: wait
void task(void) {
    if (xSemaphoreTake(data_ready, pdMS_TO_TICKS(100)) == pdTRUE) {
        process_data();
    }
}
```

## Debugging Interrupt Issues

### Symptoms & Solutions
| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Random crashes | Stack overflow in ISR | Reduce ISR work, check stack size |
| Missing interrupts | ISR taking too long | Profile WCET, reduce ISR complexity |
| Stuck system | Deadlock in ISR | Never lock/wait in ISR |
| Timing jitter | Interrupt latency | Prioritize correctly |

### Profiling ISR Timing
```c
// Use GPIO toggle to measure on oscilloscope
void ISR(void) {
    GPIO_SET(PROFILE_PIN);      // Rising edge start
    // ... ISR code ...
    GPIO_CLEAR(PROFILE_PIN);    // Falling edge end
    // Oscilloscope shows ISR duration
}
```

## Memory Layout for ISR Stacks

### Embedded Systems: Limited RAM
```
RAM Layout (16KB example):
[Bootloader] 0x0000 (if present)
[Main Stack] grows DOWN from top
...free...
[Heap] grows UP
[Data + BSS] bottom
[ISR Stack] (task-local in RTOS, global in bare-metal)
```

### FreeRTOS: Task Stacks
```c
// Each task gets its own stack (ISRs share kernel stack)
xTaskCreate(task_function, "task", 256, NULL, 1, NULL);
// Stack size in words: 256 * 4 = 1KB (typical for simple task)
```
