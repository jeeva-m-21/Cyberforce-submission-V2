# Communication Protocols & Patterns

## UART/Serial Communication

### UART Frame Structure & Error Handling
```c
#define UART_START_BYTE 0x02
#define UART_END_BYTE 0x03

typedef struct {
    uint8_t start;
    uint8_t command;
    uint8_t length;
    uint8_t payload[256];
    uint16_t checksum;
    uint8_t end;
} uart_frame_t;

// Calculate 16-bit checksum
uint16_t calculate_checksum(const uint8_t *data, uint16_t length) {
    uint16_t crc = 0xFFFF;
    for (uint16_t i = 0; i < length; i++) {
        crc = (crc << 8) ^ crc16_table[(crc >> 8) ^ data[i]];
    }
    return crc;
}

int uart_send_frame(const uart_frame_t *frame) {
    if (frame->length > 256) return ERR_INVALID_LENGTH;
    
    uint8_t buffer[512];
    uint16_t idx = 0;
    
    buffer[idx++] = frame->start;
    buffer[idx++] = frame->command;
    buffer[idx++] = frame->length;
    
    // Copy payload
    for (int i = 0; i < frame->length; i++) {
        buffer[idx++] = frame->payload[i];
    }
    
    // Add checksum (big-endian)
    buffer[idx++] = (frame->checksum >> 8);
    buffer[idx++] = (frame->checksum & 0xFF);
    buffer[idx++] = frame->end;
    
    // Send with timeout
    for (int i = 0; i < idx; i++) {
        if (uart_write_byte(buffer[i], 10) != 0) {
            return ERR_UART_TIMEOUT;
        }
    }
    
    return ERR_OK;
}

int uart_receive_frame(uart_frame_t *frame) {
    // Wait for start byte
    uint8_t byte;
    uint32_t timeout = get_tick() + 1000;  // 1 second timeout
    
    while (get_tick() < timeout) {
        if (uart_read_byte(&byte, 10) == 0) {
            if (byte == UART_START_BYTE) break;
        }
    }
    
    if (byte != UART_START_BYTE) {
        return ERR_FRAME_SYNC;
    }
    
    frame->start = byte;
    
    // Read header
    if (uart_read_byte(&frame->command, 10) != 0) return ERR_UART_TIMEOUT;
    if (uart_read_byte(&frame->length, 10) != 0) return ERR_UART_TIMEOUT;
    
    if (frame->length > 256) {
        return ERR_INVALID_LENGTH;
    }
    
    // Read payload
    for (int i = 0; i < frame->length; i++) {
        if (uart_read_byte(&frame->payload[i], 10) != 0) {
            return ERR_UART_TIMEOUT;
        }
    }
    
    // Read checksum
    uint8_t crc_hi, crc_lo;
    if (uart_read_byte(&crc_hi, 10) != 0) return ERR_UART_TIMEOUT;
    if (uart_read_byte(&crc_lo, 10) != 0) return ERR_UART_TIMEOUT;
    frame->checksum = (crc_hi << 8) | crc_lo;
    
    // Read end byte
    if (uart_read_byte(&frame->end, 10) != 0) return ERR_UART_TIMEOUT;
    if (frame->end != UART_END_BYTE) {
        return ERR_FRAME_END;
    }
    
    // Verify checksum
    uint16_t calculated = calculate_checksum(frame->payload, frame->length);
    if (calculated != frame->checksum) {
        return ERR_CHECKSUM;
    }
    
    return ERR_OK;
}
```

## CAN Bus Communication

### CAN Frame Structure
```c
#define CAN_FRAME_RTR 0x40000000
#define CAN_FRAME_EFF 0x80000000  // Extended ID
#define CAN_MAX_DATA_LEN 8
#define CAN_TIMEOUT_MS 100

typedef struct {
    uint32_t id;      // 11-bit or 29-bit ID
    uint8_t dlc;      // Data Length Code (0-8)
    uint8_t data[8];
    uint8_t is_extended;
} can_frame_t;

int can_send_frame(const can_frame_t *frame) {
    if (frame->dlc > 8) return ERR_INVALID_DLC;
    
    uint32_t can_id = frame->id;
    if (frame->is_extended) {
        can_id |= CAN_FRAME_EFF;
    }
    
    return HAL_CAN_Transmit(can_id, frame->data, frame->dlc);
}

int can_receive_frame(can_frame_t *frame, uint16_t timeout_ms) {
    uint32_t can_id;
    uint8_t data[8];
    uint8_t dlc;
    
    int result = HAL_CAN_Receive(&can_id, data, &dlc, timeout_ms);
    if (result != 0) return result;
    
    frame->is_extended = (can_id & CAN_FRAME_EFF) != 0;
    frame->id = can_id & (frame->is_extended ? 0x1FFFFFFF : 0x7FF);
    frame->dlc = dlc;
    
    for (int i = 0; i < dlc; i++) {
        frame->data[i] = data[i];
    }
    
    return ERR_OK;
}
```

### CAN Message Filtering
```c
typedef struct {
    uint32_t id;
    uint32_t mask;
    void (*handler)(const can_frame_t *);
} can_filter_t;

#define MAX_CAN_FILTERS 8
can_filter_t can_filters[MAX_CAN_FILTERS];
uint8_t can_filter_count = 0;

int can_register_filter(uint32_t id, uint32_t mask, 
                        void (*handler)(const can_frame_t *)) {
    if (can_filter_count >= MAX_CAN_FILTERS) {
        return ERR_MAX_FILTERS;
    }
    
    can_filters[can_filter_count].id = id;
    can_filters[can_filter_count].mask = mask;
    can_filters[can_filter_count].handler = handler;
    
    return ERR_OK;
}

void can_process_frame(const can_frame_t *frame) {
    for (int i = 0; i < can_filter_count; i++) {
        if ((frame->id & can_filters[i].mask) == can_filters[i].id) {
            can_filters[i].handler(frame);
        }
    }
}
```

## I2C Master/Slave Communication

### I2C Master Transaction
```c
#define I2C_ADDRESS_7BIT 0x50
#define I2C_ADDRESS_10BIT 0x0380

typedef struct {
    uint8_t address;
    uint8_t *tx_buffer;
    uint16_t tx_length;
    uint8_t *rx_buffer;
    uint16_t rx_length;
    uint16_t timeout_ms;
} i2c_transaction_t;

int i2c_master_write(uint8_t slave_addr, const uint8_t *data, 
                      uint16_t length, uint16_t timeout_ms) {
    if (length > 256) return ERR_INVALID_LENGTH;
    
    return HAL_I2C_Master_Transmit(I2C_1, slave_addr << 1, 
                                    (uint8_t *)data, length, timeout_ms);
}

int i2c_master_read(uint8_t slave_addr, uint8_t *data, 
                     uint16_t length, uint16_t timeout_ms) {
    if (length > 256) return ERR_INVALID_LENGTH;
    
    return HAL_I2C_Master_Receive(I2C_1, slave_addr << 1, 
                                   data, length, timeout_ms);
}

int i2c_master_read_register(uint8_t slave_addr, uint8_t reg, 
                              uint8_t *value, uint16_t timeout_ms) {
    // Write register address, then read value
    int result = HAL_I2C_Master_Transmit(I2C_1, slave_addr << 1, 
                                         &reg, 1, timeout_ms);
    if (result != 0) return result;
    
    return HAL_I2C_Master_Receive(I2C_1, slave_addr << 1, 
                                  value, 1, timeout_ms);
}
```

## Modbus RTU Master

### Modbus Function Codes
```c
#define MODBUS_FC_READ_COILS 0x01
#define MODBUS_FC_READ_DISCRETE_INPUTS 0x02
#define MODBUS_FC_READ_HOLDING_REGS 0x03
#define MODBUS_FC_READ_INPUT_REGS 0x04
#define MODBUS_FC_WRITE_SINGLE_COIL 0x05
#define MODBUS_FC_WRITE_SINGLE_REG 0x06
#define MODBUS_FC_WRITE_MULTIPLE_REGS 0x10

typedef struct {
    uint8_t slave_id;
    uint8_t function_code;
    uint16_t start_address;
    uint16_t quantity;
    uint8_t *data;
    uint16_t data_length;
} modbus_request_t;

uint16_t modbus_crc16(const uint8_t *buffer, uint16_t length) {
    uint16_t crc = 0xFFFF;
    for (uint16_t i = 0; i < length; i++) {
        crc ^= buffer[i];
        for (int j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    return crc;
}

int modbus_read_holding_registers(uint8_t slave_id, uint16_t start_addr, 
                                   uint16_t count, uint16_t *values) {
    uint8_t request[8];
    request[0] = slave_id;
    request[1] = MODBUS_FC_READ_HOLDING_REGS;
    request[2] = (start_addr >> 8);
    request[3] = (start_addr & 0xFF);
    request[4] = (count >> 8);
    request[5] = (count & 0xFF);
    
    uint16_t crc = modbus_crc16(request, 6);
    request[6] = (crc & 0xFF);
    request[7] = (crc >> 8);
    
    // Send request
    uart_send_data(request, 8);
    
    // Receive response
    uint8_t response[256];
    uint16_t resp_len = uart_receive_data(response, 256, 100);
    
    if (resp_len < 5) return ERR_INVALID_RESPONSE;
    if (response[0] != slave_id) return ERR_SLAVE_ID;
    if (response[1] != MODBUS_FC_READ_HOLDING_REGS) return ERR_FUNCTION_CODE;
    
    uint8_t byte_count = response[2];
    if ((byte_count % 2) != 0) return ERR_INVALID_BYTE_COUNT;
    
    // Verify CRC
    uint16_t resp_crc = response[resp_len-1] << 8 | response[resp_len-2];
    uint16_t calc_crc = modbus_crc16(response, resp_len - 2);
    if (resp_crc != calc_crc) return ERR_CRC;
    
    // Extract register values (big-endian)
    for (int i = 0; i < byte_count / 2; i++) {
        values[i] = (response[3 + i*2] << 8) | response[4 + i*2];
    }
    
    return byte_count / 2;  // Return number of registers read
}
```

## SPI Protocol

### SPI Master Transaction
```c
#define SPI_MODE_0 0  // CPOL=0, CPHA=0
#define SPI_MODE_1 1  // CPOL=0, CPHA=1
#define SPI_MODE_2 2  // CPOL=1, CPHA=0
#define SPI_MODE_3 3  // CPOL=1, CPHA=1

typedef struct {
    uint32_t clock_speed;
    uint8_t mode;
    uint8_t bits_per_word;
} spi_config_t;

int spi_transceive(uint8_t *tx_data, uint8_t *rx_data, uint16_t length) {
    if (length > 65536) return ERR_INVALID_LENGTH;
    
    return HAL_SPI_TransceiveIT(SPI_1, tx_data, rx_data, length);
}

// Blocking transfer
int spi_write_read_blocking(const uint8_t *tx, uint8_t *rx, uint16_t length) {
    HAL_GPIO_CLEAR(SPI_CS_PIN);  // Pull CS low
    
    int result = HAL_SPI_TransceiveBlocking(SPI_1, (uint8_t *)tx, rx, 
                                           length, 1000);
    
    HAL_GPIO_SET(SPI_CS_PIN);    // Release CS
    
    return result;
}
```

## Packet Framing Pattern

### Generic Packet Encoder/Decoder
```c
typedef struct {
    uint8_t type;
    uint16_t length;
    uint8_t *payload;
    uint16_t sequence;
    uint16_t checksum;
} packet_t;

int packet_encode(const packet_t *pkt, uint8_t *buffer, 
                   uint16_t max_length) {
    if (max_length < (pkt->length + 8)) {
        return ERR_BUFFER_TOO_SMALL;
    }
    
    uint16_t idx = 0;
    buffer[idx++] = 0xAA;  // Sync byte
    buffer[idx++] = pkt->type;
    buffer[idx++] = (pkt->length >> 8);
    buffer[idx++] = (pkt->length & 0xFF);
    buffer[idx++] = (pkt->sequence >> 8);
    buffer[idx++] = (pkt->sequence & 0xFF);
    
    // Copy payload
    for (int i = 0; i < pkt->length; i++) {
        buffer[idx++] = pkt->payload[i];
    }
    
    // Calculate and add checksum
    uint16_t crc = calculate_checksum(buffer, idx);
    buffer[idx++] = (crc >> 8);
    buffer[idx++] = (crc & 0xFF);
    
    return idx;  // Return encoded length
}

int packet_decode(const uint8_t *buffer, uint16_t buffer_length, 
                   packet_t *pkt) {
    if (buffer_length < 8) return ERR_PACKET_TOO_SHORT;
    if (buffer[0] != 0xAA) return ERR_SYNC_BYTE;
    
    pkt->type = buffer[1];
    pkt->length = (buffer[2] << 8) | buffer[3];
    pkt->sequence = (buffer[4] << 8) | buffer[5];
    
    if (buffer_length < (6 + pkt->length + 2)) {
        return ERR_INCOMPLETE_PACKET;
    }
    
    pkt->payload = (uint8_t *)&buffer[6];
    
    // Verify checksum
    uint16_t received_crc = (buffer[6 + pkt->length] << 8) | 
                            buffer[7 + pkt->length];
    uint16_t calculated_crc = calculate_checksum(buffer, 6 + pkt->length);
    
    if (received_crc != calculated_crc) {
        return ERR_CHECKSUM;
    }
    
    return 6 + pkt->length + 2;  // Total packet length
}
```
