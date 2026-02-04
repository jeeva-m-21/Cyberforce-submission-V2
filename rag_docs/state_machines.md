# State Machines & Control Flow

## Finite State Machine (FSM) Design

### FSM Structure Pattern
```c
typedef enum {
    STATE_IDLE = 0,
    STATE_INITIALIZING = 1,
    STATE_RUNNING = 2,
    STATE_ERROR = 3,
    STATE_SHUTDOWN = 4
} device_state_t;

typedef enum {
    EVENT_START = 0,
    EVENT_SENSOR_READY = 1,
    EVENT_TIMEOUT = 2,
    EVENT_ERROR = 3,
    EVENT_STOP = 4
} device_event_t;

// Strict separation: state storage and behavior
typedef struct {
    device_state_t current_state;
    device_state_t previous_state;
    uint32_t state_entry_time;
    uint8_t error_code;
} fsm_context_t;

volatile fsm_context_t device_fsm = {
    .current_state = STATE_IDLE,
    .previous_state = STATE_IDLE,
    .state_entry_time = 0,
    .error_code = 0
};
```

### Explicit State Handler Pattern
```c
// Handlers per state (function pointers)
typedef error_code_t (*state_handler_t)(fsm_context_t *ctx, 
                                        device_event_t event);

error_code_t handle_idle(fsm_context_t *ctx, device_event_t event) {
    switch (event) {
        case EVENT_START:
            ctx->current_state = STATE_INITIALIZING;
            ctx->state_entry_time = get_tick();
            init_sensors();
            return ERR_OK;
        case EVENT_SENSOR_READY:  // Unexpected
            return ERR_INVALID_STATE;
        default:
            return ERR_UNKNOWN_EVENT;
    }
}

error_code_t handle_initializing(fsm_context_t *ctx, 
                                  device_event_t event) {
    uint32_t elapsed = get_tick() - ctx->state_entry_time;
    
    switch (event) {
        case EVENT_SENSOR_READY:
            ctx->current_state = STATE_RUNNING;
            return ERR_OK;
        case EVENT_TIMEOUT:
            if (elapsed > 5000) {  // 5 second timeout
                ctx->current_state = STATE_ERROR;
                ctx->error_code = ERR_INIT_TIMEOUT;
            }
            return ERR_OK;
        case EVENT_ERROR:
            ctx->current_state = STATE_ERROR;
            return ERR_OK;
        default:
            return ERR_UNKNOWN_EVENT;
    }
}

error_code_t handle_running(fsm_context_t *ctx, device_event_t event) {
    switch (event) {
        case EVENT_ERROR:
            ctx->current_state = STATE_ERROR;
            return ERR_OK;
        case EVENT_STOP:
            ctx->current_state = STATE_SHUTDOWN;
            return ERR_OK;
        default:
            return ERR_OK;  // Ignore other events while running
    }
}

error_code_t handle_error(fsm_context_t *ctx, device_event_t event) {
    switch (event) {
        case EVENT_STOP:
            ctx->current_state = STATE_IDLE;
            ctx->error_code = 0;
            return ERR_OK;
        default:
            return ERR_OK;  // Stuck in error until stopped
    }
}

// Dispatch table
static const state_handler_t handlers[5] = {
    [STATE_IDLE] = handle_idle,
    [STATE_INITIALIZING] = handle_initializing,
    [STATE_RUNNING] = handle_running,
    [STATE_ERROR] = handle_error,
    [STATE_SHUTDOWN] = NULL  // Terminal state
};
```

### FSM Event Processor
```c
error_code_t fsm_process_event(fsm_context_t *ctx, device_event_t event) {
    if (ctx->current_state >= 5) {
        return ERR_INVALID_STATE;
    }
    
    state_handler_t handler = handlers[ctx->current_state];
    if (handler == NULL) {
        return ERR_NO_HANDLER;
    }
    
    error_code_t result = handler(ctx, event);
    
    // Log state change
    if (ctx->current_state != ctx->previous_state) {
        log_state_change(ctx->previous_state, ctx->current_state);
        ctx->previous_state = ctx->current_state;
    }
    
    return result;
}

void fsm_init(void) {
    device_fsm.current_state = STATE_IDLE;
    device_fsm.previous_state = STATE_IDLE;
    device_fsm.state_entry_time = get_tick();
    device_fsm.error_code = 0;
}
```

## Event Queue Pattern

### Safe Event Queue (No malloc)
```c
#define MAX_EVENTS 32

typedef struct {
    device_event_t events[MAX_EVENTS];
    uint16_t head;
    uint16_t tail;
    uint16_t count;
} event_queue_t;

volatile event_queue_t event_q = {0};

void event_queue_push(device_event_t event) {
    // Disable interrupts for atomic operation
    uint32_t primask = __get_PRIMASK();
    __disable_irq();
    
    if (event_q.count < MAX_EVENTS) {
        event_q.events[event_q.head] = event;
        event_q.head = (event_q.head + 1) % MAX_EVENTS;
        event_q.count++;
    } else {
        log_error(ERR_EVENT_QUEUE_FULL);
    }
    
    __set_PRIMASK(primask);
}

device_event_t event_queue_pop(void) {
    if (event_q.count == 0) {
        return -1;  // No event
    }
    
    device_event_t event = event_q.events[event_q.tail];
    event_q.tail = (event_q.tail + 1) % MAX_EVENTS;
    event_q.count--;
    return event;
}

void main_loop(void) {
    fsm_init();
    
    while (1) {
        device_event_t event = event_queue_pop();
        if (event != -1) {
            fsm_process_event(&device_fsm, event);
        }
        
        // Optional: timeout check
        check_state_timeouts(&device_fsm);
    }
}
```

## State Entry/Exit Actions

### Explicit Lifecycle Hooks
```c
typedef struct {
    device_state_t state;
    const char *name;
    void (*on_entry)(fsm_context_t *ctx);
    void (*on_exit)(fsm_context_t *ctx);
    error_code_t (*on_event)(fsm_context_t *ctx, device_event_t event);
} state_def_t;

void on_running_entry(fsm_context_t *ctx) {
    led_set_color(GREEN);
    start_measurement_timer();
    ctx->state_entry_time = get_tick();
}

void on_running_exit(fsm_context_t *ctx) {
    stop_measurement_timer();
    log_event("Exiting running state");
}

void on_error_entry(fsm_context_t *ctx) {
    led_set_color(RED);
    disable_all_actuators();
    log_error(ctx->error_code);
}

void on_error_exit(fsm_context_t *ctx) {
    reset_error_state();
}

// State transition with hooks
error_code_t fsm_transition(fsm_context_t *ctx, device_state_t new_state) {
    // Exit current state
    if (current_state_def->on_exit) {
        current_state_def->on_exit(ctx);
    }
    
    // Change state
    ctx->previous_state = ctx->current_state;
    ctx->current_state = new_state;
    ctx->state_entry_time = get_tick();
    
    // Enter new state
    if (new_state_def->on_entry) {
        new_state_def->on_entry(ctx);
    }
    
    return ERR_OK;
}
```

## Hierarchical State Machines

### Parent-Child State Pattern
```c
typedef enum {
    PARENT_SLEEP = 0,
    PARENT_ACTIVE = 1,
    PARENT_LOW_POWER = 2
} parent_state_t;

typedef enum {
    CHILD_INIT = 0,
    CHILD_SAMPLE = 1,
    CHILD_IDLE = 2
} child_state_t;

typedef struct {
    parent_state_t parent_state;
    child_state_t child_state;
} hierarchical_fsm_t;

// Event handling at multiple levels
void hsm_process_event(hierarchical_fsm_t *ctx, device_event_t event) {
    // First check if parent handles it
    if (!parent_handles_event(ctx->parent_state, event)) {
        // If not, delegate to child
        child_handle_event(ctx->child_state, event);
    }
}
```

## Guard Conditions

### Conditional State Transitions
```c
// Guard function: returns true if transition is allowed
typedef error_code_t (*guard_t)(fsm_context_t *ctx);

error_code_t guard_sensor_initialized(fsm_context_t *ctx) {
    return (sensor_state == SENSOR_READY) ? ERR_OK : ERR_PRECONDITION;
}

error_code_t guard_battery_sufficient(fsm_context_t *ctx) {
    return (battery_voltage > MIN_VOLTAGE) ? ERR_OK : ERR_LOW_BATTERY;
}

error_code_t fsm_guarded_transition(fsm_context_t *ctx, 
                                    device_state_t new_state,
                                    guard_t guard) {
    if (guard(ctx) != ERR_OK) {
        return ERR_GUARD_FAILED;  // Transition blocked
    }
    return fsm_transition(ctx, new_state);
}
```

## Deadlock Prevention

### Timeout-Based Recovery
```c
void check_state_timeouts(fsm_context_t *ctx) {
    uint32_t elapsed = get_tick() - ctx->state_entry_time;
    
    switch (ctx->current_state) {
        case STATE_INITIALIZING:
            if (elapsed > 10000) {  // 10 second max
                fsm_process_event(ctx, EVENT_TIMEOUT);
            }
            break;
        case STATE_RUNNING:
            if (elapsed > 60000) {  // 60 second watchdog
                fsm_process_event(ctx, EVENT_TIMEOUT);
            }
            break;
        default:
            break;
    }
}

// FSM should never be stuck: each state has exit conditions
```

## Debugging State Machines

### State Machine Tracer
```c
#define TRACE_ENABLED 1

typedef struct {
    uint32_t timestamp;
    device_state_t state;
    device_event_t event;
    error_code_t result;
} fsm_trace_t;

#define TRACE_SIZE 100
fsm_trace_t trace_log[TRACE_SIZE];
uint16_t trace_idx = 0;

void fsm_trace_event(device_state_t state, device_event_t event,
                     error_code_t result) {
    #if TRACE_ENABLED
        trace_log[trace_idx].timestamp = get_tick();
        trace_log[trace_idx].state = state;
        trace_log[trace_idx].event = event;
        trace_log[trace_idx].result = result;
        trace_idx = (trace_idx + 1) % TRACE_SIZE;
    #endif
}

// Print trace for debugging
void fsm_dump_trace(void) {
    for (int i = 0; i < TRACE_SIZE; i++) {
        fsm_trace_t *t = &trace_log[(trace_idx + i) % TRACE_SIZE];
        printf("[%lu] State %d, Event %d, Result %d\n",
               t->timestamp, t->state, t->event, t->result);
    }
}
```
