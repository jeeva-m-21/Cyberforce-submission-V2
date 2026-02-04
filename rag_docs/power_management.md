# Power Management & Low-Power Design

## Power States & Modes

### MCU Sleep Modes
```c
typedef enum {
    POWER_MODE_ACTIVE = 0,      // Full speed, all peripherals on
    POWER_MODE_SLEEP = 1,       // CPU halted, peripherals active
    POWER_MODE_DEEP_SLEEP = 2,  // Most peripherals off, RAM retained
    POWER_MODE_STANDBY = 3,     // Minimal power, only RTC active
    POWER_MODE_SHUTDOWN = 4     // Maximum power savings, data lost
} power_mode_t;

typedef struct {
    power_mode_t current_mode;
    uint32_t power_consumption_ua;  // Current in microamps
    uint32_t mode_entry_time;
} power_state_t;

volatile power_state_t power_state = {
    .current_mode = POWER_MODE_ACTIVE,
    .power_consumption_ua = 50000  // 50mA at full speed
};

// Mode power consumption (typical values for ARM Cortex-M4)
const uint32_t mode_power_ua[] = {
    [POWER_MODE_ACTIVE] = 50000,      // 50mA
    [POWER_MODE_SLEEP] = 20000,       // 20mA
    [POWER_MODE_DEEP_SLEEP] = 5000,   // 5mA
    [POWER_MODE_STANDBY] = 100,       // 100uA
    [POWER_MODE_SHUTDOWN] = 1         // 1uA
};
```

### Entering Sleep Modes
```c
void enter_sleep_mode(void) {
    // Disable unnecessary peripherals first
    disable_uart();
    disable_spi();
    disable_i2c();
    
    // Keep only essential interrupts enabled
    clear_all_interrupt_flags();
    
    // Execute sleep instruction
    HAL_PWR_EnterSleepMode();
    
    // Code resumes here after interrupt wakes MCU
    re_enable_peripherals();
}

void enter_deep_sleep_mode(void) {
    // Save critical state to RAM
    save_state_to_ram();
    
    // Disable all but RTC
    disable_all_peripherals_except_rtc();
    
    // Clear all interrupt flags
    clear_all_interrupt_flags();
    
    // Enable wakeup interrupts
    enable_rtc_interrupt();
    enable_external_interrupt_1();
    
    // Enter deep sleep (RTC can wake)
    HAL_PWR_EnterDeepSleepMode();
}

void enter_standby_mode(void) {
    // Save critical state
    uint32_t critical_data = get_critical_state();
    write_to_backup_register(critical_data);
    
    // All peripherals off
    disable_all_peripherals();
    
    // Only RTC active
    enable_rtc_only();
    
    // Set RTC alarm for wakeup
    set_rtc_alarm(60);  // Wake in 60 seconds
    
    HAL_PWR_EnterStandbyMode();
}
```

## Clock Management

### Dynamic Frequency Scaling (DVFS)
```c
typedef enum {
    FREQ_32MHZ = 0,
    FREQ_64MHZ = 1,
    FREQ_128MHZ = 2,
    FREQ_168MHZ = 3
} clock_freq_t;

typedef struct {
    clock_freq_t frequency;
    uint8_t voltage_level;  // Voltage required for this freq
} clock_config_t;

clock_config_t freq_config[] = {
    {.frequency = FREQ_32MHZ, .voltage_level = 1},    // 1.2V
    {.frequency = FREQ_64MHZ, .voltage_level = 1},    // 1.2V
    {.frequency = FREQ_128MHZ, .voltage_level = 2},   // 1.5V
    {.frequency = FREQ_168MHZ, .voltage_level = 3}    // 1.8V
};

int set_clock_frequency(clock_freq_t new_freq) {
    // Adjust voltage before increasing frequency
    if (new_freq > power_state.current_freq) {
        set_voltage_level(freq_config[new_freq].voltage_level);
        delay_ms(1);  // Voltage stabilization
    }
    
    // Change PLL or system clock
    HAL_RCC_SetSysClk(new_freq * 1000000);  // Convert to Hz
    
    // Adjust voltage after decreasing frequency
    if (new_freq < power_state.current_freq) {
        set_voltage_level(freq_config[new_freq].voltage_level);
    }
    
    power_state.current_freq = new_freq;
    update_systick_timer();
    
    return ERR_OK;
}

// Adaptive frequency scaling based on workload
void task_light_workload(void) {
    set_clock_frequency(FREQ_32MHZ);
    // Light processing
    set_clock_frequency(FREQ_128MHZ);
}

void task_heavy_workload(void) {
    set_clock_frequency(FREQ_168MHZ);
    // Heavy processing
    set_clock_frequency(FREQ_64MHZ);
}
```

## Peripheral Power Gating

### Selective Peripheral Disable
```c
typedef struct {
    uint8_t uart_enabled;
    uint8_t spi_enabled;
    uint8_t i2c_enabled;
    uint8_t adc_enabled;
    uint8_t timer_enabled;
} peripheral_state_t;

peripheral_state_t peripherals = {
    .uart_enabled = 1,
    .spi_enabled = 1,
    .i2c_enabled = 1,
    .adc_enabled = 1,
    .timer_enabled = 1
};

void disable_peripheral(uint8_t peripheral_id) {
    switch (peripheral_id) {
        case PERIPHERAL_UART:
            HAL_UART_Disable();
            HAL_RCC_Disable_UART_Clock();
            peripherals.uart_enabled = 0;
            break;
        case PERIPHERAL_SPI:
            HAL_SPI_Disable();
            HAL_RCC_Disable_SPI_Clock();
            peripherals.spi_enabled = 0;
            break;
        case PERIPHERAL_ADC:
            HAL_ADC_Disable();
            HAL_RCC_Disable_ADC_Clock();
            peripherals.adc_enabled = 0;
            break;
    }
}

void enable_peripheral(uint8_t peripheral_id) {
    switch (peripheral_id) {
        case PERIPHERAL_UART:
            HAL_RCC_Enable_UART_Clock();
            HAL_UART_Enable();
            peripherals.uart_enabled = 1;
            break;
        case PERIPHERAL_SPI:
            HAL_RCC_Enable_SPI_Clock();
            HAL_SPI_Enable();
            peripherals.spi_enabled = 1;
            break;
    }
}

int sensor_read_with_power_gating(uint16_t *value) {
    // Enable ADC temporarily
    enable_peripheral(PERIPHERAL_ADC);
    
    // Read sensor
    delay_ms(10);  // Stabilization
    *value = adc_read();
    
    // Disable ADC again
    disable_peripheral(PERIPHERAL_ADC);
    
    return ERR_OK;
}
```

## Battery Monitoring

### Battery Voltage & Charge Estimation
```c
#define BATTERY_MIN_VOLTAGE_MV 2500  // Minimum safe operating voltage
#define BATTERY_MAX_VOLTAGE_MV 4200  // Maximum (Lithium)
#define BATTERY_CAPACITY_MAH 500     // Battery capacity

typedef struct {
    uint16_t voltage_mv;
    float percentage;
    float estimated_runtime_hours;
    uint8_t warning_level;
} battery_state_t;

volatile battery_state_t battery = {0};

float estimate_charge_percentage(uint16_t voltage_mv) {
    // Linear estimation (simplified)
    if (voltage_mv < BATTERY_MIN_VOLTAGE_MV) return 0.0;
    if (voltage_mv > BATTERY_MAX_VOLTAGE_MV) return 100.0;
    
    return ((float)(voltage_mv - BATTERY_MIN_VOLTAGE_MV) /
            (BATTERY_MAX_VOLTAGE_MV - BATTERY_MIN_VOLTAGE_MV)) * 100.0;
}

uint32_t estimate_runtime_hours(uint16_t current_avg_ua) {
    if (current_avg_ua == 0) return 0;
    
    uint32_t runtime_ms = (BATTERY_CAPACITY_MAH * 1000000) / current_avg_ua;
    return runtime_ms / (3600 * 1000);
}

void monitor_battery(void) {
    // Read battery voltage via ADC
    battery.voltage_mv = adc_read_battery_voltage();
    battery.percentage = estimate_charge_percentage(battery.voltage_mv);
    
    // Calculate average current
    uint32_t avg_current_ua = calculate_average_current();
    battery.estimated_runtime_hours = estimate_runtime_hours(avg_current_ua);
    
    // Set warning levels
    if (battery.percentage < 10) {
        battery.warning_level = BATTERY_CRITICAL;  // Shutdown soon
        event_queue_push(EVENT_LOW_BATTERY_CRITICAL);
    } else if (battery.percentage < 25) {
        battery.warning_level = BATTERY_LOW;  // Reduce workload
        event_queue_push(EVENT_LOW_BATTERY_WARNING);
    } else {
        battery.warning_level = BATTERY_OK;
    }
}
```

## Idle Time Processing

### Task Scheduling for Power Efficiency
```c
#define IDLE_THRESHOLD_MS 100  // Go to sleep if idle > 100ms

typedef struct {
    uint32_t last_activity_time;
    uint32_t total_idle_time_ms;
    uint32_t total_active_time_ms;
    uint8_t is_idle;
} idle_monitor_t;

volatile idle_monitor_t idle = {0};

void mark_activity(void) {
    idle.last_activity_time = get_tick();
    idle.is_idle = 0;
}

void check_and_handle_idle(void) {
    uint32_t now = get_tick();
    uint32_t idle_duration = now - idle.last_activity_time;
    
    if (idle_duration > IDLE_THRESHOLD_MS && !idle.is_idle) {
        idle.is_idle = 1;
        idle.total_idle_time_ms += idle_duration;
        
        // Enter low-power mode
        switch (power_state.current_mode) {
            case POWER_MODE_ACTIVE:
                enter_sleep_mode();
                break;
            case POWER_MODE_SLEEP:
                if (idle_duration > 1000) {
                    enter_deep_sleep_mode();
                }
                break;
        }
    } else if (idle_duration <= IDLE_THRESHOLD_MS && idle.is_idle) {
        idle.is_idle = 0;
        idle.total_active_time_ms += idle_duration;
    }
}
```

## Watchdog & Reliability in Low-Power Modes

### Safe Watchdog in Sleep
```c
void configure_safe_watchdog(void) {
    // Watchdog continues running in sleep mode
    // Timeout: 2 seconds
    IWDG_Init(2000);
    
    // If MCU sleeps longer than 2 seconds without feeding,
    // watchdog resets it
}

void main_loop_power_aware(void) {
    while (1) {
        // Do work
        process_sensor_data();
        
        // Feed watchdog before sleeping
        IWDG_Feed();
        
        // Check for idle
        check_and_handle_idle();
        
        // Even in sleep mode, watchdog runs
        // RTC will wake MCU periodically
    }
}

void rtc_wakeup_handler(void) {
    // Called every 60 seconds by RTC
    // Feed watchdog to prevent reset
    IWDG_Feed();
    
    // Check battery
    monitor_battery();
}
```

## Power Consumption Profiling

### Current Measurement Points
```c
typedef struct {
    uint32_t timestamp;
    uint32_t current_ua;
    power_mode_t mode;
    uint8_t cpu_freq_level;
} power_sample_t;

#define POWER_PROFILE_SIZE 256
power_sample_t power_profile[POWER_PROFILE_SIZE];
uint16_t profile_idx = 0;

void record_power_sample(void) {
    if (profile_idx >= POWER_PROFILE_SIZE) return;
    
    power_profile[profile_idx].timestamp = get_tick();
    power_profile[profile_idx].current_ua = measure_current();
    power_profile[profile_idx].mode = power_state.current_mode;
    power_profile[profile_idx].cpu_freq_level = power_state.current_freq;
    
    profile_idx++;
}

void calculate_average_power(void) {
    uint64_t total_power = 0;
    for (int i = 0; i < profile_idx; i++) {
        total_power += power_profile[i].current_ua;
    }
    
    uint32_t avg_power_ua = total_power / profile_idx;
    uint32_t avg_power_ma = avg_power_ua / 1000;
    
    printf("Average power: %lu mA\n", avg_power_ma);
}
```
