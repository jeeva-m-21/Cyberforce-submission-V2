# Hardware Interfaces & Peripheral Configuration

## GPIO (General Purpose Input/Output)

### GPIO Pin Modes & Configuration
```c
// Define pin names for readability
#define LED_RED_PIN     5
#define LED_GREEN_PIN   6
#define BUTTON_PIN      10
#define RELAY_PIN       12

// GPIO Direction
typedef enum {
    GPIO_INPUT = 0,
    GPIO_OUTPUT = 1,
    GPIO_ALT_FUNC = 2,
    GPIO_ANALOG = 3
} gpio_direction_t;

// GPIO Pull Modes
typedef enum {
    GPIO_PULL_NONE = 0,
    GPIO_PULL_UP = 1,
    GPIO_PULL_DOWN = 2
} gpio_pull_t;

void gpio_init(uint8_t pin, gpio_direction_t dir, gpio_pull_t pull) {
    // Vendor-specific implementation
    HAL_GPIO_Init(pin, dir, pull);
}
```

### LED Control Pattern
```c
#define LED_ON(pin)     GPIO_SET(pin)
#define LED_OFF(pin)    GPIO_CLEAR(pin)
#define LED_TOGGLE(pin) GPIO_TOGGLE(pin)

void init_leds(void) {
    gpio_init(LED_RED_PIN, GPIO_OUTPUT, GPIO_PULL_NONE);
    gpio_init(LED_GREEN_PIN, GPIO_OUTPUT, GPIO_PULL_NONE);
    LED_OFF(LED_RED_PIN);
    LED_OFF(LED_GREEN_PIN);
}

void indicate_error(void) {
    LED_ON(LED_RED_PIN);
    LED_OFF(LED_GREEN_PIN);
}

void indicate_ready(void) {
    LED_OFF(LED_RED_PIN);
    LED_ON(LED_GREEN_PIN);
}
```

### Button Input (Debounced)
```c
#define DEBOUNCE_MS 20
#define SAMPLE_COUNT 3

uint8_t button_is_pressed(uint8_t pin) {
    // Sample button state multiple times
    uint8_t samples = 0;
    for (int i = 0; i < SAMPLE_COUNT; i++) {
        if (GPIO_READ(pin)) samples++;
        delay_ms(DEBOUNCE_MS / SAMPLE_COUNT);
    }
    // Return true if majority of samples show pressed
    return (samples >= SAMPLE_COUNT / 2);
}
```

## UART/Serial Communication

### UART Configuration Pattern
```c
#define UART_BAUDRATE 115200
#define UART_DATA_BITS 8
#define UART_STOP_BITS 1
#define UART_PARITY NONE

typedef enum {
    UART_PARITY_NONE = 0,
    UART_PARITY_ODD = 1,
    UART_PARITY_EVEN = 2
} uart_parity_t;

void uart_init(uint32_t baudrate, uart_parity_t parity) {
    // Configure UART with error checking
    if (baudrate < 300 || baudrate > 3000000) {
        return ERROR_INVALID_BAUDRATE;
    }
    // Vendor-specific init
    HAL_UART_Init(baudrate, parity);
    
    // Enable RX interrupt for non-blocking receives
    HAL_UART_EnableRxInterrupt();
}
```

### Blocking Send (Safe)
```c
void uart_send_byte(uint8_t byte) {
    HAL_UART_WRITE(byte);
    while (!HAL_UART_TX_COMPLETE()) {
        // Wait for transmit to finish
        // Timeout protection
        static uint32_t timeout = 0;
        if (timeout++ > 10000) {
            error_handler(ERR_UART_TIMEOUT);
            return;
        }
    }
}

void uart_send_string(const char *str) {
    while (*str) {
        uart_send_byte(*str++);
    }
}
```

### Interrupt-Driven Receive
```c
#define RX_BUFFER_SIZE 256

typedef struct {
    uint8_t buffer[RX_BUFFER_SIZE];
    uint16_t head;
    uint16_t tail;
} uart_rx_buffer_t;

volatile uart_rx_buffer_t rx_buf = {0};

// ISR (keep very short)
void UART_RX_ISR(void) {
    uint8_t byte = HAL_UART_READ_BYTE();
    uint16_t next_head = (rx_buf.head + 1) % RX_BUFFER_SIZE;
    
    if (next_head != rx_buf.tail) {  // Buffer not full
        rx_buf.buffer[rx_buf.head] = byte;
        rx_buf.head = next_head;
    }
    // If buffer full, discard byte (log error in main)
}

// Main loop: safe to call
uint8_t uart_get_byte(void) {
    if (rx_buf.head == rx_buf.tail) return 0;  // No data
    
    uint8_t byte = rx_buf.buffer[rx_buf.tail];
    rx_buf.tail = (rx_buf.tail + 1) % RX_BUFFER_SIZE;
    return byte;
}
```

## ADC (Analog-to-Digital Converter)

### ADC Configuration
```c
#define ADC_RESOLUTION 12  // 12-bit = 4096 values
#define ADC_VREF 3.3       // Reference voltage 3.3V
#define ADC_CHANNELS 4

typedef struct {
    uint8_t pin;
    uint16_t raw_value;
    float voltage;
    float calibration_offset;
    float calibration_scale;
} adc_channel_t;

adc_channel_t adc_channels[ADC_CHANNELS] = {
    { .pin = 0, .calibration_scale = 1.0, .calibration_offset = 0 },
    { .pin = 1, .calibration_scale = 1.0, .calibration_offset = 0 },
    // ... more channels
};

void adc_init(void) {
    HAL_ADC_Init(ADC_RESOLUTION);
    HAL_ADC_SetVRef(ADC_VREF);
    
    for (int i = 0; i < ADC_CHANNELS; i++) {
        HAL_ADC_ConfigChannel(adc_channels[i].pin, i);
    }
}
```

### ADC Reading with Filtering
```c
uint16_t adc_read_averaged(uint8_t channel, uint8_t samples) {
    uint32_t sum = 0;
    
    // Validate inputs
    if (channel >= ADC_CHANNELS || samples == 0) {
        return 0;
    }
    
    for (int i = 0; i < samples; i++) {
        sum += HAL_ADC_Read(channel);
    }
    
    return sum / samples;
}

float adc_to_voltage(uint16_t raw_value) {
    // Convert ADC raw value to voltage
    return ((float)raw_value / (1 << ADC_RESOLUTION)) * ADC_VREF;
}

float adc_read_calibrated(uint8_t channel) {
    uint16_t raw = adc_read_averaged(channel, 10);
    adc_channels[channel].raw_value = raw;
    
    float voltage = adc_to_voltage(raw);
    float calibrated = voltage * adc_channels[channel].calibration_scale
                       + adc_channels[channel].calibration_offset;
    
    adc_channels[channel].voltage = calibrated;
    return calibrated;
}
```

## PWM (Pulse Width Modulation)

### PWM Configuration
```c
#define PWM_FREQUENCY 1000  // 1 kHz
#define PWM_RESOLUTION 8    // 256 steps (0-255)

typedef struct {
    uint8_t pin;
    uint8_t duty_cycle;  // 0-255
    uint16_t frequency;
} pwm_channel_t;

void pwm_init(uint8_t pin, uint16_t frequency) {
    HAL_PWM_Init(pin, frequency, (1 << PWM_RESOLUTION) - 1);
}

void pwm_set_duty(uint8_t pin, uint8_t duty) {
    // duty: 0 = 0%, 255 = 100%
    if (duty > 255) duty = 255;
    HAL_PWM_SetDuty(pin, duty);
}

void pwm_set_duty_percent(uint8_t pin, float percent) {
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    uint8_t duty = (uint8_t)(percent * 2.55);
    pwm_set_duty(pin, duty);
}
```

### Motor Control Pattern
```c
void motor_speed(uint8_t speed) {
    // speed: 0-255
    pwm_set_duty(MOTOR_PWM_PIN, speed);
}

void motor_brake(void) {
    pwm_set_duty(MOTOR_PWM_PIN, 0);
}

void led_brightness(uint8_t brightness) {
    pwm_set_duty(LED_PWM_PIN, brightness);
    // brightness 0 = off, 255 = full brightness
}
```

## Timers & Counters

### Timer Setup (Periodic Tasks)
```c
#define TIMER_PERIOD_MS 100  // 100ms periodic task

void timer_init(uint16_t period_ms) {
    uint32_t counter_value = (SYSTEM_CLOCK / 1000) * period_ms;
    HAL_Timer_Init(TIMER_2, counter_value);
    HAL_Timer_EnableInterrupt(TIMER_2);
}

void TIM2_ISR(void) {
    // Called every 100ms
    static uint32_t tick_count = 0;
    tick_count++;
    
    // Signal task (don't do work here)
    g_timer_event = 1;
    
    // Clear flag
    HAL_Timer_ClearFlag(TIMER_2);
}

void main_loop(void) {
    while (1) {
        if (g_timer_event) {
            g_timer_event = 0;
            periodic_task();
        }
    }
}
```

## Watchdog Timer

### Watchdog Configuration
```c
#define WATCHDOG_TIMEOUT_MS 2000

void watchdog_init(uint16_t timeout_ms) {
    HAL_Watchdog_Init(timeout_ms);
}

void watchdog_feed(void) {
    HAL_Watchdog_Reset();
    // Call periodically (< timeout_ms)
}

void main_loop(void) {
    while (1) {
        execute_critical_task();
        watchdog_feed();  // Pet the dog
        
        if (execution_time > WATCHDOG_TIMEOUT_MS) {
            // Watchdog will reboot if we don't feed it
            error_handler();
        }
    }
}
```

## I2C Communication

### I2C Master Configuration
```c
#define I2C_CLOCK_SPEED 400000  // 400 kHz standard

typedef enum {
    I2C_SPEED_100KHZ = 100000,
    I2C_SPEED_400KHZ = 400000,
    I2C_SPEED_1MHZ = 1000000
} i2c_speed_t;

void i2c_init(i2c_speed_t speed) {
    HAL_I2C_Init(I2C_1, speed);
}

// Write to register
error_code_t i2c_write_register(uint8_t slave_addr, uint8_t reg, 
                                uint8_t value) {
    uint8_t data[2] = {reg, value};
    return HAL_I2C_Write(I2C_1, slave_addr, data, 2, 100);
}

// Read from register
error_code_t i2c_read_register(uint8_t slave_addr, uint8_t reg, 
                               uint8_t *value) {
    error_code_t err = HAL_I2C_Write(I2C_1, slave_addr, &reg, 1, 50);
    if (err) return err;
    return HAL_I2C_Read(I2C_1, slave_addr, value, 1, 100);
}
```

### SPI Communication
```c
#define SPI_CLOCK_SPEED 1000000  // 1 MHz
#define SPI_MODE SPI_MODE_0       // CPOL=0, CPHA=0

void spi_init(uint32_t clock_speed) {
    HAL_SPI_Init(SPI_1, clock_speed);
}

void spi_transfer(uint8_t *tx_data, uint8_t *rx_data, uint16_t length) {
    HAL_SPI_Transfer(SPI_1, tx_data, rx_data, length);
}

uint16_t spi_read_sensor(void) {
    uint8_t tx[2] = {0xAA, 0x00};  // Command + dummy
    uint8_t rx[2] = {0};
    
    HAL_GPIO_CLEAR(SENSOR_CS_PIN);  // Pull CS low
    spi_transfer(tx, rx, 2);
    HAL_GPIO_SET(SENSOR_CS_PIN);    // Release CS
    
    return (rx[0] << 8) | rx[1];
}
```
