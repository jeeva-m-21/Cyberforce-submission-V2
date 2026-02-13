# Quality Agent Prompt (v1)

**Agent:** <<AGENT_ROLE>>

**Task:** Analyze the GENERATED CODE artifacts and produce a comprehensive code quality and safety report. The analysis must be specific to the actual code that was generated in this run.

**Target MCU:** <<MCU>>
**Generated Code Location:** <<CODE_ARTIFACTS>>
**Modules Analyzed:** <<MODULE>>

**Analysis Requirements:**

1. **Code-Specific Analysis:**
   - Read and analyze the ACTUAL generated .c/.h/.ino files
   - Calculate REAL metrics from the code (not estimates)
   - Identify ACTUAL issues in the generated code
   - Reference specific line numbers and functions

2. **Quality Metrics to Calculate:**
   - Lines of Code (LOC) - total and per module
   - Cyclomatic Complexity - per function
   - Function Count and Average Function Size
   - Comment Density (comment lines / total lines)
   - Global Variables Count
   - Magic Numbers (hardcoded values) Count
   - Maximum Nesting Depth
   - Code Duplication Percentage

3. **Safety Analysis (MISRA-C / CERT-C):**
   - Check for dangerous patterns:
     - Dynamic memory allocation (malloc/free)
     - goto statements
     - Unbounded loops (while(1) without break conditions)
     - Magic numbers without #define
     - Missing input validation
     - Buffer overflow risks
     - Integer overflow possibilities
     - Uninitialized variables
   - Flag MISRA-C rule violations with specific rule numbers
   - Provide severity levels: Critical, High, Medium, Low

4. **MCU-Specific Checks:**
   - Verify hardware register access safety
   - Check interrupt safety (volatile usage)
   - Validate memory usage against MCU limits
   - Check for proper peripheral initialization
   - Verify clock configuration
   - Check watchdog timer usage

5. **Code Quality Issues:**
   - Long functions (>50 lines)
   - Deep nesting (>4 levels)
   - Duplicate code blocks
   - Inconsistent naming
   - Missing error handling
   - TODO/FIXME comments

**Output Format (JSON):**
```json
{
  "summary": {
    "overall_score": 85,
    "total_issues": 12,
    "critical_issues": 0,
    "high_issues": 2,
    "medium_issues": 5,
    "low_issues": 5,
    "files_analyzed": 3,
    "total_loc": 450
  },
  "metrics": {
    "lines_of_code": 450,
    "comment_lines": 120,
    "comment_density": 26.7,
    "functions": 15,
    "avg_function_size": 30,
    "max_cyclomatic_complexity": 8,
    "avg_cyclomatic_complexity": 3.5,
    "global_variables": 5,
    "magic_numbers": 8,
    "max_nesting_depth": 3,
    "code_duplication": 2.5
  },
  "issues": [
    {
      "id": "Q001",
      "severity": "high",
      "category": "MISRA-C",
      "rule": "Rule 21.3",
      "file": "uart_module.c",
      "line": 45,
      "function": "uart_send",
      "description": "Dynamic memory allocation (malloc) detected",
      "code_snippet": "char* buffer = malloc(size);",
      "recommendation": "Use static buffer allocation: char buffer[MAX_SIZE];",
      "impact": "May cause memory fragmentation and unpredictable behavior"
    }
  ],
  "misra_compliance": {
    "rules_checked": 50,
    "rules_passed": 45,
    "rules_failed": 5,
    "compliance_percentage": 90,
    "violations": ["Rule 21.3", "Rule 10.1", "Rule 8.4"]
  },
  "recommendations": [
    "Add input validation in uart_send() function",
    "Replace magic number 9600 with #define BAUD_RATE 9600",
    "Add watchdog timer reset in main loop"
  ]
}
```

**Constraints:**
<<CONSTRAINTS>>

**RAG Context (Quality Rules):**
<<RAG_CONTEXT>>

**Target Modules:**
<<MODULE>>
