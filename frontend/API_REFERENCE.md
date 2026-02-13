# API Response Types Reference

## Request Models

### GenerationRequest
```typescript
{
  specification: SystemSpecification
  include_tests: boolean
  include_docs: boolean
  run_quality_checks: boolean
}
```

### SystemSpecification
```typescript
{
  project_name: string              // Required: "Smart Motor Controller"
  description: string               // Required: "System description"
  target_platform: string           // Required: "ARM Cortex-M4"
  modules: ModuleConfig[]           // Required: At least 1 module
  safety_critical: boolean          // Optional: false
  optimization_goal: string         // Optional: "speed|size|power|balanced"
}
```

### ModuleConfig
```typescript
{
  name: string                      // Required: "Communication"
  description: string               // Required: "Module description"
  type: string                      // Required: "comm|logger|sensor|actuator|memory|ota|custom"
  requirements?: string[]           // Optional: ["UART", "SPI"]
}
```

## Response Models

### GenerationResponse
```typescript
{
  run_id: string                    // Unique run identifier
  status: string                    // "queued|running|completed|failed"
  message: string                   // Status message
}
```

### RunStatus
```typescript
{
  run_id: string
  status: string                    // "queued|running|completed|failed"
  progress: number                  // 0-100
  message: string
  started_at?: string               // ISO timestamp
  completed_at?: string             // ISO timestamp
  artifacts?: {
    architecture: number
    code_modules: number
    tests: number
  }
  errors?: string[]
}
```

## API Examples

### 1. Start Firmware Generation
```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "specification": {
      "project_name": "Motor Control",
      "description": "Embedded motor controller firmware",
      "target_platform": "ARM Cortex-M4",
      "modules": [
        {
          "name": "Communication",
          "description": "Modbus RS485 communication",
          "type": "comm",
          "requirements": ["UART", "RS485"]
        },
        {
          "name": "Logger",
          "description": "Event logging system",
          "type": "logger",
          "requirements": ["FLASH"]
        }
      ],
      "safety_critical": true,
      "optimization_goal": "balanced"
    },
    "include_tests": true,
    "include_docs": true,
    "run_quality_checks": true
  }'
```

### 2. Check Run Status
```bash
curl http://localhost:8000/api/runs/a7b3c4d0
```

### 3. List All Runs
```bash
curl http://localhost:8000/api/runs
```

### 4. Get Templates
```bash
curl http://localhost:8000/api/templates
```

### 5. Health Check
```bash
curl http://localhost:8000/health
```

## Frontend Integration

### Using the API Client

```typescript
import { apiClient } from './api/client'

// Generate firmware
const response = await apiClient.generateFirmware({
  specification: {
    project_name: "My Project",
    // ... rest of spec
  },
  include_tests: true,
  include_docs: true,
  run_quality_checks: true
})

// Get run status
const status = await apiClient.getRun(response.data.run_id)

// List all runs
const runs = await apiClient.listRuns()

// Load templates
const templates = await apiClient.getTemplates()
```

### Using Zustand Store

```typescript
import { useGeneratorStore } from './store/generatorStore'

const Component = () => {
  const { specification, setSpecification, addModule } = useGeneratorStore()

  // Update specification
  setSpecification({
    project_name: "My Project",
    // ...
  })

  // Add module
  addModule({
    name: "Sensor",
    description: "Temperature sensor",
    type: "sensor",
    requirements: ["I2C"]
  })
}
```

## Error Handling

All API errors are automatically handled by the frontend:

```typescript
try {
  await apiClient.generateFirmware(request)
  // Success - toast notification shown
} catch (error) {
  // Error shown in toast and stored in state
  const { error } = useGeneratorStore()
  console.error(error)
}
```

## Development Tools

### FastAPI Swagger UI
Visit `http://localhost:8000/docs` to:
- View all endpoints
- Try API calls directly
- See request/response schemas
- Test authentication

### React DevTools
Install extension to debug:
- Component hierarchy
- Props and state
- Performance profiling
- Hook debugging

### Network Tab (DevTools)
Monitor API calls:
- Request/response headers
- Payload inspection
- Timing analysis
- Error responses

## Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 404 | Not Found | Resource not found |
| 422 | Validation Error | Input validation failed |
| 500 | Server Error | Internal server error |

## CORS Headers

Frontend can access backend due to CORS configuration:

```python
CORSMiddleware(
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Update `allow_origins` when deploying to production!
