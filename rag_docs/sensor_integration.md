# Sensor Integration & Data Processing

## Sensor Types & Initialization

### Temperature Sensor (Analog)
```c
#define TEMP_SENSOR_PIN ADC_CHANNEL_0
#define TEMP_SENSOR_VREF 3.3
#define TEMP_OFFSET -40     // -40C at 0V
#define TEMP_SCALE 0.01     // 1 LSB = 0.01C (for 10-bit ADC)

typedef struct {
    uint16_t raw_value;
    float temperature_c;
    float min_recorded;
    float max_recorded;
    uint32_t sample_count;
} temp_sensor_t;

volatile temp_sensor_t temp_sensor = {0};

void temp_sensor_init(void) {
    adc_init();
    adc_configure_channel(TEMP_SENSOR_PIN, ADC_12BIT, TEMP_SENSOR_VREF);
    temp_sensor.min_recorded = 999.0;
    temp_sensor.max_recorded = -999.0;
}

float temp_sensor_read(void) {
    // Read and filter
    uint16_t raw = adc_read_averaged(TEMP_SENSOR_PIN, 10);
    temp_sensor.raw_value = raw;
    
    // Convert to celsius: V = (raw / 4096) * 3.3V
    float voltage = (raw / 4096.0) * TEMP_SENSOR_VREF;
    
    // Sensor-specific calibration
    temp_sensor.temperature_c = (voltage / 0.01) + TEMP_OFFSET;
    
    // Track min/max
    if (temp_sensor.temperature_c < temp_sensor.min_recorded) {
        temp_sensor.min_recorded = temp_sensor.temperature_c;
    }
    if (temp_sensor.temperature_c > temp_sensor.max_recorded) {
        temp_sensor.max_recorded = temp_sensor.temperature_c;
    }
    
    temp_sensor.sample_count++;
    return temp_sensor.temperature_c;
}
```

### Pressure Sensor (I2C)
```c
#define BMP280_I2C_ADDR 0x77
#define BMP280_CHIP_ID 0xD0
#define BMP280_READ_ID 0x58
#define BMP280_CALIB_DATA_SIZE 26

typedef struct {
    float pressure_hpa;
    float temperature_c;
    float altitude_m;
    uint32_t read_count;
} pressure_sensor_t;

volatile pressure_sensor_t pressure_sensor = {0};

typedef struct {
    uint16_t T1;
    int16_t T2, T3;
    uint16_t P1;
    int16_t P2, P3, P4, P5, P6, P7, P8, P9;
} bmp280_calib_t;

bmp280_calib_t bmp280_calib;

int pressure_sensor_init(void) {
    // Verify chip ID
    uint8_t chip_id;
    if (i2c_read_register(BMP280_I2C_ADDR, BMP280_CHIP_ID, &chip_id) != 0) {
        return ERR_I2C_INIT;
    }
    if (chip_id != BMP280_READ_ID) {
        return ERR_CHIP_ID;
    }
    
    // Read calibration data
    uint8_t calib_data[BMP280_CALIB_DATA_SIZE];
    if (i2c_read_registers(BMP280_I2C_ADDR, 0x88, calib_data, 
                           BMP280_CALIB_DATA_SIZE) != 0) {
        return ERR_CALIB_LOAD;
    }
    
    // Parse calibration (little-endian)
    bmp280_calib.T1 = calib_data[1] << 8 | calib_data[0];
    bmp280_calib.T2 = calib_data[3] << 8 | calib_data[2];
    // ... rest of calibration
    
    // Configure sensor (ctrl_meas register)
    uint8_t config = 0x57;  // Temperature + pressure oversampling
    return i2c_write_register(BMP280_I2C_ADDR, 0xF4, config);
}

float pressure_sensor_read(void) {
    // Read raw pressure and temperature
    uint8_t adc_data[6];
    if (i2c_read_registers(BMP280_I2C_ADDR, 0xF7, adc_data, 6) != 0) {
        return 0.0;
    }
    
    // Convert ADC to pressure (simplified)
    int32_t adc_p = (adc_data[0] << 12) | (adc_data[1] << 4) | 
                    (adc_data[2] >> 4);
    
    // Apply calibration formula (BMP280 datasheet)
    // This is simplified; full formula is complex
    pressure_sensor.pressure_hpa = (adc_p / 256.0) / 100.0;
    pressure_sensor.read_count++;
    
    return pressure_sensor.pressure_hpa;
}
```

### Proximity Sensor (GPIO Edge Detection)
```c
#define PROX_SENSOR_PIN 5
#define PROX_SENSOR_SENSITIVITY_US 100

typedef struct {
    uint32_t detection_count;
    uint32_t last_detection_time;
    uint8_t is_triggered;
} proximity_sensor_t;

volatile proximity_sensor_t proximity_sensor = {0};

void prox_sensor_init(void) {
    gpio_init(PROX_SENSOR_PIN, GPIO_INPUT, GPIO_PULL_UP);
    HAL_GPIO_ConfigureInterrupt(PROX_SENSOR_PIN, GPIO_FALLING_EDGE);
}

void PROX_ISR(void) {
    uint32_t now = get_tick();
    
    // Debounce: ignore if triggered within last 100ms
    if ((now - proximity_sensor.last_detection_time) > 
        PROX_SENSOR_SENSITIVITY_US) {
        
        proximity_sensor.is_triggered = 1;
        proximity_sensor.detection_count++;
        proximity_sensor.last_detection_time = now;
        
        // Signal to main loop
        event_queue_push(EVENT_PROXIMITY_DETECTED);
    }
}
```

## Data Filtering & Averaging

### Moving Average Filter
```c
#define FILTER_SIZE 10

typedef struct {
    int16_t samples[FILTER_SIZE];
    uint8_t index;
    uint8_t count;
    int32_t sum;
} moving_average_t;

void filter_init(moving_average_t *filter) {
    filter->index = 0;
    filter->count = 0;
    filter->sum = 0;
}

int16_t filter_add_sample(moving_average_t *filter, int16_t sample) {
    // Remove old sample if buffer full
    if (filter->count == FILTER_SIZE) {
        filter->sum -= filter->samples[filter->index];
    } else {
        filter->count++;
    }
    
    // Add new sample
    filter->samples[filter->index] = sample;
    filter->sum += sample;
    filter->index = (filter->index + 1) % FILTER_SIZE;
    
    // Return average
    return filter->sum / filter->count;
}
```

### Kalman Filter (For Noisy Sensors)
```c
typedef struct {
    float x;              // State estimate
    float p;              // Estimate error
    float q;              // Process noise
    float r;              // Measurement noise
    float k;              // Kalman gain
} kalman_filter_t;

void kalman_init(kalman_filter_t *kf, float q, float r) {
    kf->x = 0;
    kf->p = 1.0;
    kf->q = q;
    kf->r = r;
    kf->k = 0;
}

float kalman_update(kalman_filter_t *kf, float measurement) {
    // Prediction
    kf->p = kf->p + kf->q;
    
    // Kalman gain
    kf->k = kf->p / (kf->p + kf->r);
    
    // Correction
    kf->x = kf->x + kf->k * (measurement - kf->x);
    
    // Update estimate error
    kf->p = (1 - kf->k) * kf->p;
    
    return kf->x;
}
```

### Exponential Moving Average (EMA)
```c
#define EMA_ALPHA 0.3  // Smoothing factor (0-1)

typedef struct {
    float ema;
    uint32_t sample_count;
} ema_filter_t;

void ema_init(ema_filter_t *ema) {
    ema->ema = 0;
    ema->sample_count = 0;
}

float ema_update(ema_filter_t *ema, float sample) {
    if (ema->sample_count == 0) {
        ema->ema = sample;
    } else {
        ema->ema = (EMA_ALPHA * sample) + ((1 - EMA_ALPHA) * ema->ema);
    }
    ema->sample_count++;
    return ema->ema;
}
```

## Multi-Sensor Fusion

### Sensor Redundancy & Voting
```c
#define NUM_SENSORS 3
#define SENSOR_CONSENSUS_THRESHOLD 2

typedef struct {
    int16_t values[NUM_SENSORS];
    int16_t result;
    uint8_t valid_count;
} sensor_fusion_t;

int16_t sensor_fusion_median(sensor_fusion_t *fusion) {
    // Sort values
    for (int i = 0; i < NUM_SENSORS - 1; i++) {
        for (int j = i + 1; j < NUM_SENSORS; j++) {
            if (fusion->values[i] > fusion->values[j]) {
                int16_t temp = fusion->values[i];
                fusion->values[i] = fusion->values[j];
                fusion->values[j] = temp;
            }
        }
    }
    
    // Return middle value
    return fusion->values[NUM_SENSORS / 2];
}

int16_t sensor_fusion_average(sensor_fusion_t *fusion) {
    int32_t sum = 0;
    for (int i = 0; i < NUM_SENSORS; i++) {
        sum += fusion->values[i];
    }
    return sum / NUM_SENSORS;
}
```

## Calibration & Error Correction

### Sensor Offset & Scale Calibration
```c
typedef struct {
    float offset;
    float scale;
    uint16_t min_raw;
    uint16_t max_raw;
} sensor_calibration_t;

sensor_calibration_t temp_calib = {
    .offset = 0.0,
    .scale = 1.0,
    .min_raw = 0,
    .max_raw = 4095
};

float sensor_apply_calibration(uint16_t raw_value, 
                               const sensor_calibration_t *calib) {
    // Clip to valid range
    uint16_t clipped = raw_value;
    if (clipped < calib->min_raw) clipped = calib->min_raw;
    if (clipped > calib->max_raw) clipped = calib->max_raw;
    
    // Normalize to 0-1 range
    float normalized = (float)(clipped - calib->min_raw) / 
                      (calib->max_raw - calib->min_raw);
    
    // Apply calibration
    return (normalized * calib->scale) + calib->offset;
}

int calibrate_sensor_two_point(uint16_t raw_low, float actual_low,
                               uint16_t raw_high, float actual_high,
                               sensor_calibration_t *calib) {
    if (raw_high == raw_low) return ERR_CALIBRATION;
    
    calib->scale = (actual_high - actual_low) / (raw_high - raw_low);
    calib->offset = actual_low - (calib->scale * raw_low);
    calib->min_raw = raw_low;
    calib->max_raw = raw_high;
    
    return ERR_OK;
}
```

## Data Quality Checks

### Outlier Detection
```c
#define OUTLIER_THRESHOLD_STDDEV 3.0

typedef struct {
    float mean;
    float stddev;
    uint32_t sample_count;
} statistics_t;

uint8_t is_outlier(float value, const statistics_t *stats) {
    float deviation = (value - stats->mean) / stats->stddev;
    return (deviation > OUTLIER_THRESHOLD_STDDEV) || 
           (deviation < -OUTLIER_THRESHOLD_STDDEV);
}

void update_statistics(statistics_t *stats, float value) {
    // Simplified running mean/stddev calculation
    // Full implementation requires Welford's algorithm
    stats->mean = (stats->mean * stats->sample_count + value) / 
                 (stats->sample_count + 1);
    stats->sample_count++;
}
```

### Sensor Health Monitoring
```c
typedef struct {
    uint32_t read_count;
    uint32_t error_count;
    uint32_t last_read_time;
    uint32_t timeout_threshold_ms;
} sensor_health_t;

sensor_health_t temp_health = {
    .read_count = 0,
    .error_count = 0,
    .timeout_threshold_ms = 5000
};

int check_sensor_health(sensor_health_t *health) {
    uint32_t now = get_tick();
    
    // Check timeout
    if ((now - health->last_read_time) > health->timeout_threshold_ms) {
        health->error_count++;
        return ERR_SENSOR_TIMEOUT;
    }
    
    // Check error rate
    if (health->read_count > 100) {
        float error_rate = (float)health->error_count / health->read_count;
        if (error_rate > 0.1) {  // More than 10% error
            return ERR_SENSOR_DEGRADED;
        }
    }
    
    return ERR_OK;
}
```

## Sensor Reading Pattern (Complete)

### Unified Sensor Read with Error Handling
```c
typedef enum {
    SENSOR_STATUS_OK = 0,
    SENSOR_STATUS_ERROR = 1,
    SENSOR_STATUS_TIMEOUT = 2,
    SENSOR_STATUS_RANGE_ERROR = 3
} sensor_status_t;

typedef struct {
    float value;
    sensor_status_t status;
    uint32_t timestamp;
} sensor_reading_t;

sensor_reading_t sensor_read_safe(int sensor_id, 
                                   uint16_t timeout_ms) {
    sensor_reading_t reading = {0};
    reading.timestamp = get_tick();
    
    if (sensor_id >= NUM_SENSORS) {
        reading.status = SENSOR_STATUS_ERROR;
        return reading;
    }
    
    // Attempt read with timeout
    int result = sensor_read(sensor_id, &reading.value, timeout_ms);
    
    if (result != 0) {
        reading.status = SENSOR_STATUS_TIMEOUT;
        return reading;
    }
    
    // Range check
    if (reading.value < SENSOR_MIN_VALUE || 
        reading.value > SENSOR_MAX_VALUE) {
        reading.status = SENSOR_STATUS_RANGE_ERROR;
        return reading;
    }
    
    reading.status = SENSOR_STATUS_OK;
    return reading;
}
```
