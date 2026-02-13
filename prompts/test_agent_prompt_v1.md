# Test Agent Prompt (v1)

**Agent:** <<AGENT_ROLE>>

**Task:** Generate comprehensive testing artifacts in TWO formats:
1. **Test Code** (.c/.cpp files) - Executable unit tests
2. **Test Cases Document** (.md file) - Human-readable test scenarios in table format

**Target MCU:** <<MCU>>
**Modules to Test:** <<MODULE>>

**Output Requirements:**

### Part 1: Test Code (Executable)
Generate actual C/C++ test code that can be compiled and run:
- Use appropriate testing framework (Unity, CppUTest, or custom for embedded)
- Include test setup and teardown functions
- Test each hardware module interface
- Test normal operation scenarios
- Test error conditions and edge cases
- Include mock/stub functions for hardware if needed
- Return as: `###TEST_CODE###\n[code here]\n`

### Part 2: Test Cases Document (Markdown Table Format)
Generate a well-formatted Markdown document with test case tables covering ALL scenarios:

**Required Format:**
```markdown
# Test Cases for [Project Name]

## Overview
- **MCU Target:** [Board]
- **Modules Tested:** [List]
- **Test Coverage:** [Estimated %]

## Test Case Summary
| Test ID | Module | Category | Priority | Status |
|---------|--------|----------|----------|--------|
| TC001 | UART | Functional | High | Ready |
| TC002 | I2C | Integration | Medium | Ready |

## Detailed Test Cases

### Module: [Module Name]

#### Functional Tests
| Test ID | Test Name | Description | Preconditions | Test Steps | Expected Result | Pass Criteria |
|---------|-----------|-------------|---------------|------------|-----------------|---------------|
| TC001 | UART Init | Verify UART initialization | Hardware connected | 1. Call init()\n2. Check registers | UART enabled, baud rate set | Registers match expected |
| TC002 | UART Send | Send data via UART | UART initialized | 1. Send "TEST"\n2. Check TX buffer | Data transmitted | TX complete flag set |

#### Boundary Tests
| Test ID | Test Name | Input | Expected Output | Notes |
|---------|-----------|-------|-----------------|-------|
| TC010 | Max Buffer | 256 bytes | Success | Buffer limit |
| TC011 | Empty Send | 0 bytes | Error code -1 | Invalid input |

#### Error Handling Tests
| Test ID | Scenario | Trigger | Expected Behavior |
|---------|----------|---------|-------------------|
| TC020 | Timeout | No response 1000ms | Return timeout error |
| TC021 | Invalid param | NULL pointer | Return error, no crash |

#### Integration Tests
| Test ID | Modules | Interaction | Expected Result |
|---------|---------|-------------|------------------|
| TC030 | UART + I2C | Send I2C data via UART log | Both work correctly |

... [Continue for ALL modules and scenarios]
```

Return as: `###TEST_CASES###\n[markdown here]\n`

**Test Coverage Requirements:**
Cover ALL of these scenarios for each module:
1. **Initialization Tests:** Module startup, configuration
2. **Functional Tests:** Normal operation paths
3. **Boundary Tests:** Min/max values, buffer limits
4. **Error Handling:** Invalid inputs, timeouts, failures
5. **Integration Tests:** Module interactions
6. **Performance Tests:** Timing, throughput (if applicable)
7. **Safety Tests:** MISRA compliance, memory safety
8. **Hardware-Specific:** Pin states, register values

**Constraints:**
<<CONSTRAINTS>>

**RAG Context:**
<<RAG_CONTEXT>>

**Module Details:**
<<MODULE>>
