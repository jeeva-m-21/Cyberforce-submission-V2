# Embedded C Safety Guidelines

## MISRA C:2012 Key Rules for Firmware

### Memory Safety
- **Rule 11.3**: Do not cast away const or volatile qualifiers
- **Rule 20.7**: Macro parameters must be enclosed in parentheses
- **Rule 22.4**: Do not open files in append mode; use exclusive write

### Control Flow
- **Rule 14.2**: Do not use goto statements
- **Rule 14.3**: Consistently use loop termination conditions
- **Rule 15.5**: A function should have a single point of exit

### Integer Operations
- **Rule 10.1**: Operands must not be of an inappropriate essential type
- **Rule 10.4**: Operands of an operator should not be unnecessarily converted

## CERT C Guidelines

### CWE-120: Buffer Overflow
- Always validate buffer sizes before write operations
- Use safe string functions (strncpy instead of strcpy)
- Implement bounds checking at module boundaries

### CWE-190: Integer Overflow
- Check for overflow before arithmetic operations
- Use fixed-width integer types (uint16_t, int32_t)
- Document maximum ranges for all numeric types

## Practical Patterns

### Safe Error Handling
```c
typedef enum {
    ERR_SUCCESS = 0,
    ERR_NULL_PTR = 1,
    ERR_OVERFLOW = 2,
    ERR_INVALID_STATE = 3
} error_code_t;

#define CHECK_NULL(ptr) if ((ptr) == NULL) return ERR_NULL_PTR
```

### Safe Buffer Access
```c
#define ARRAY_SIZE 256
#define SAFE_WRITE(buf, idx, val) \
    do { \
        if ((idx) < ARRAY_SIZE) { (buf)[(idx)] = (val); } \
        else { /* log error */ } \
    } while(0)
```
