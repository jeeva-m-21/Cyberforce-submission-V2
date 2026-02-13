<div align="center">

# 🚀 CyberForge-26

### AI-Assisted Governed Firmware Generation Platform

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Code Style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Framework](https://img.shields.io/badge/framework-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB.svg)](https://vitejs.dev/)

**Deterministic, Auditable, Industrial-Grade Embedded Firmware Generation**

[Features](#-key-features) • [Architecture](#-architecture-overview) • [Installation](#-installation) • [Usage](#-usage) • [Development](#-development)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
  - [Windows Installation](#windows-installation)
  - [Linux/macOS Installation](#linuxmacos-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
  - [CLI Usage](#cli-usage)
  - [API Usage](#api-usage)
  - [Web UI Usage](#web-ui-usage)
- [Development](#-development)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)
- [Contact & Support](#-contact--support)

---

## 🎯 Overview

**CyberForge-26** is an industry-aligned, multi-agent AI platform designed to automatically generate embedded C/C++ firmware, unit tests, quality reports, and OTA-ready deployment artifacts for any microcontroller class based on structured requirements.

### What Makes CyberForge-26 Different?

This is **not** a single firmware generator or a ChatGPT wrapper. CyberForge-26 is a **governed AI system** that:

- 🎯 **Decomposes** firmware generation into specialized AI agents
- 🛡️ **Enforces** strict governance using Model Control Protocol (MCP)
- 📊 **Produces** verifiable, auditable artifacts with full traceability
- 🔌 **Remains** MCU-agnostic with abstracted hardware-specific logic
- 🔒 **Supports** secure OTA firmware updates
- ✅ **Follows** industry-aligned embedded software practices

### Core Design Principles

1. **Deterministic Orchestration** - DAG-based execution ensures reproducible builds
2. **Strict Governance** - MCP enforces architectural constraints and safety rules
3. **RAG-Backed Generation** - Grounding documents ensure best practices
4. **Complete Auditability** - Every artifact is traceable and versioned
5. **Modular Architecture** - Clean separation of concerns across agents

---

## ✨ Key Features

### 🤖 Multi-Agent Architecture
- **Architecture Agent** - Generates system architecture and module decomposition
- **Code Agent** - Produces embedded C/C++ firmware code
- **Test Agent** - Creates comprehensive unit and integration tests
- **Quality Agent** - Performs static analysis and quality checks
- **Build Agent** - Handles compilation, linking, and binary generation

### 🎨 Modern Web Interface
- Real-time firmware generation monitoring
- Interactive artifact viewer
- JSON configuration editor
- Run history and comparison
- Dark/Light theme support

### 🔧 Backend API
- RESTful API built with FastAPI
- WebSocket support for real-time updates
- Asynchronous task processing
- Comprehensive API documentation (auto-generated)

### 📦 Artifact Management
- Structured output organization
- Version control for all artifacts
- Audit logs for compliance
- Export capabilities (ZIP, OTA packages)

### 🧠 AI Integration
- Google Gemini API integration
- Mock mode for testing without API keys
- RAG (Retrieval-Augmented Generation) for domain knowledge
- Prompt versioning and management

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│          UI Components, State Management, API Client        │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                  Backend API (FastAPI)                      │
│        REST Endpoints, Authentication, File Upload          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Core Orchestrator                         │
│         DAG Execution, Task Scheduling, State Mgmt          │
└──┬──────────┬──────────┬──────────┬──────────┬─────────────┘
   │          │          │          │          │
┌──▼───┐  ┌──▼────┐  ┌──▼────┐  ┌──▼──────┐  ┌▼──────┐
│ Arch │  │ Code  │  │ Test  │  │ Quality │  │ Build │
│Agent │  │ Agent │  │ Agent │  │ Agent   │  │ Agent │
└──┬───┘  └───┬───┘  └───┬───┘  └────┬────┘  └───┬───┘
   │          │          │           │           │
   └──────────┴──────────┴───────────┴───────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐   ┌───▼────┐   ┌───▼─────┐
   │   MCP   │   │  RAG   │   │   AI    │
   │Governor │   │ Engine │   │ Client  │
   └─────────┘   └────────┘   └─────────┘
                      │
              ┌───────▼────────┐
              │ Output/Artifacts│
              └─────────────────┘
```

### Layered Architecture

1. **Interface Layer** - CLI, Web UI, API endpoints
2. **Orchestration Layer** - DAG-based execution and state management
3. **Agent Layer** - Specialized AI agents for each generation task
4. **Governance Layer** - MCP rules, RAG retrieval, prompt management
5. **Execution Layer** - AI model invocation and artifact generation
6. **Artifact Layer** - Structured output storage and versioning

---

## 📁 Project Structure

```
cyberforge-submission-v2/
│
├── 📱 frontend/                    # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── stores/                 # Zustand state management
│   │   ├── services/               # API client services
│   │   └── types/                  # TypeScript type definitions
│   ├── examples/                   # Example configuration files
│   ├── package.json                # Frontend dependencies
│   ├── vite.config.ts              # Vite configuration
│   └── tailwind.config.ts          # Tailwind CSS configuration
│
├── 🖥️ backend_api/                 # FastAPI backend server
│   ├── main.py                     # API entry point
│   └── requirements.txt            # Backend-specific dependencies
│
├── 🧠 core/                        # Core platform logic
│   ├── orchestration/              # DAG-based orchestrator
│   │   └── orchestrator.py         # Main orchestration engine
│   ├── ai/                         # AI client wrappers
│   │   ├── gemini_wrapper.py       # Google Gemini integration
│   │   └── prompt.py               # Prompt loader and manager
│   ├── mcp/                        # Model Control Protocol
│   │   └── mcp.py                  # MCP governance rules
│   ├── rag/                        # Retrieval-Augmented Generation
│   │   └── rag.py                  # RAG engine for knowledge retrieval
│   └── artifacts.py                # Artifact management system
│
├── 🤖 agents/                      # Specialized AI agents
│   ├── base.py                     # Base agent abstract class
│   ├── architecture_agent/         # System architecture generation
│   ├── code_agent/                 # Firmware code generation
│   ├── test_agent/                 # Test suite generation
│   ├── quality_agent/              # Quality analysis and reporting
│   └── build_agent/                # Build and compilation
│
├── 📚 rag_docs/                    # RAG knowledge base
│   ├── communication_protocols.md  # I2C, SPI, UART guides
│   ├── embedded_safety.md          # Safety-critical patterns
│   ├── hardware_interfaces.md      # GPIO, ADC, PWM guides
│   ├── interrupt_handling.md       # Interrupt best practices
│   ├── memory_management.md        # Memory optimization
│   ├── modbus_RS485.md             # Modbus protocol guide
│   ├── ota_firmware_updates.md     # OTA update patterns
│   ├── power_management.md         # Low-power techniques
│   ├── sensor_integration.md       # Sensor interfacing
│   ├── state_machines.md           # State machine patterns
│   ├── testing_strategies.md       # Embedded testing approaches
│   └── RAG_METADATA.json           # Document metadata
│
├── 💬 prompts/                     # Versioned prompt templates
│   ├── base_prompt.md              # Common instructions
│   ├── architecture_agent_prompt_v1.md
│   ├── code_agent_prompt_v1.md
│   ├── test_agent_prompt_v1.md
│   ├── quality_agent_prompt_v1.md
│   └── build_agent_prompt_v1.md
│
├── 📐 schemas/                     # JSON schemas for validation
│   ├── module_schema.json          # Module definition schema
│   └── artifact_types.json         # Artifact type definitions
│
├── 📂 output/                      # Generated artifacts (gitignored)
│   └── runs/                       # Time-stamped run directories
│       └── run_YYYYMMDD_HHMMSS/    # Individual run output
│           ├── architecture/       # Architecture artifacts
│           ├── code/               # Generated firmware code
│           ├── tests/              # Generated test suite
│           ├── quality/            # Quality reports
│           ├── build/              # Build artifacts and logs
│           └── metadata.json       # Run metadata and audit log
│
├── 🧪 tests/                       # Test suite
│   ├── test_agents_gemini.py       # Agent integration tests
│   ├── test_artifacts.py           # Artifact management tests
│   ├── test_build_agent.py         # Build agent tests
│   ├── test1.py                    # Additional tests
│   └── ...                         # Additional test files
│
├── 📖 docs/                        # Additional documentation
│   ├── quality/                    # Quality and naming documentation
│   │   ├── QUALITY_NAMING_*.md     # Quality naming standards
│   │   └── QUALITY_REPORT_NAMING.md # Quality report specs
│   ├── ui/                         # UI/Frontend documentation
│   │   ├── FRONTEND_RESTRUCTURING.md # Frontend architecture
│   │   ├── UI_VISUAL_GUIDE.md      # UI design guide
│   │   └── ARTIFACT_VIEWER_IMPROVEMENTS.md
│   ├── ARCHITECTURE.md             # Detailed architecture guide
│   ├── ARTIFACT_SYSTEM.md          # Artifact management guide
│   ├── BUILD_SUMMARY.md            # Build system overview
│   ├── MCP_FIX_SUMMARY.md          # MCP implementation notes
│   ├── VERIFICATION_CHECKLIST.md   # Verification procedures
│   └── QUICK_REFERENCE.md          # Quick reference guide
│
├── 📝 examples/                    # Example input files
│   ├── sample_input.json           # Basic example
│   ├── usecase_motor_controller.json # Motor controller example
│   ├── input_real_world.json       # Real-world scenario
│   └── arduino_simple_test.json    # Arduino test case
│
├── 🔧 scripts/                     # Utility scripts
│   ├── init_repo.ps1               # Git initialization
│   ├── setup_env.ps1               # Environment setup
│   ├── setup_ui.ps1                # UI setup script
│   ├── run_ui_dev.py               # Development UI runner
│   ├── verify_ui_build.py          # UI build verification
│   ├── start_backend_debug.ps1     # Backend debug starter
│   ├── start_dev.bat               # Development starter
│   ├── test_api.ps1                # API testing script
│   └── test_quality_reports.ps1    # Quality report tests
│
├──  Makefile                     # Build automation
├── 📋 cli.py                       # CLI entry point
├── ⚙️ pyproject.toml               # Python project configuration
├── 📦 requirements.txt             # Python runtime dependencies
├── 🛠️ requirements-dev.txt         # Python development dependencies
├── 📄 instruct.txt                 # Project goals and constraints
└── 📖 README.md                    # This file
```

### Key Files Explained

#### Configuration Files
- **`pyproject.toml`** - Python project metadata and Poetry configuration
- **`requirements.txt`** - Runtime dependencies for the core platform
- **`requirements-dev.txt`** - Development dependencies (pytest, black, flake8, mypy)
- **`.env`** - Environment variables (create from template, not committed)

#### Entry Points
- **`cli.py`** - Command-line interface for running generation pipeline
- **`backend_api/main.py`** - FastAPI server for web interface
- **`frontend/src/main.tsx`** - React application entry point

#### Core Components
- **`core/orchestration/orchestrator.py`** - Manages agent execution DAG
- **`core/artifacts.py`** - Handles artifact storage and retrieval
- **`core/mcp/mcp.py`** - Enforces governance rules on agent outputs
- **`core/rag/rag.py`** - Retrieves relevant documentation for grounding

---

## 📋 Prerequisites

### Required Software

- **Python** - Version 3.10 or higher
- **Node.js** - Version 18 or higher (for frontend)
- **npm** or **pnpm** - Package manager for frontend dependencies
- **Git** - Version control system
- **Make** - For using Makefile commands (optional, usually pre-installed on Linux/macOS)

### API Keys (Optional)

- **Google Gemini API Key** - Required only if using real AI generation
  - Get it from: https://makersuite.google.com/app/apikey
  - System works in mock mode without this for testing

---

## 🚀 Installation

### Windows Installation

#### Step 1: Clone the Repository

```powershell
# Clone the repository
git clone https://github.com/jeeva-m-21/Cyberforce-submission-V2
cd cyberforge-submission-v2

# Or if already cloned, navigate to the directory
cd C:\Users\jeeva\Documents\GitHub\Cyberforce-submission-V2
```

#### Step 2: Set Up Python Environment

```powershell
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install development dependencies (includes runtime deps)
pip install -r requirements-dev.txt

# OR install only runtime dependencies
pip install -r requirements.txt
```

**Note:** If you encounter PowerShell execution policy errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Step 3: Install Frontend Dependencies

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies using npm
npm install

# OR using pnpm (faster alternative)
pnpm install

# Return to root directory
cd ..
```

#### Step 4: Configure Environment Variables

```powershell
# Create .env file from template
Copy-Item .env.example .env -ErrorAction SilentlyContinue

# Edit .env file with your preferred editor
notepad .env
```

Add the following to `.env`:

```env
# AI Configuration (Optional - defaults to mock mode)
USE_REAL_GEMINI=0
GEMINI_API_KEY=your_api_key_here

# Backend Configuration
BACKEND_HOST=localhost
BACKEND_PORT=8000

# Frontend Configuration
VITE_API_URL=http://localhost:8000
```

#### Step 5: Verify Installation

```powershell
# Run tests to verify backend setup
pytest -q

# Check code quality
flake8 .

# Format code (optional)
black .

# Verify frontend build
cd frontend
npm run build
cd ..
```

---

### Linux/macOS Installation

#### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/jeeva-m-21/Cyberforce-submission-V2.git
cd Cyberforce-submission-V2
```

#### Step 2: Set Up Python Environment

```bash
# Create a virtual environment
python3 -m venv .venv

# Activate the virtual environment
source .venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install development dependencies
pip install -r requirements-dev.txt
```

#### Step 3: Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# OR
pnpm install

# Return to root directory
cd ..
```

#### Step 4: Configure Environment Variables

```bash
# Create .env file
cp .env.example .env 2>/dev/null || touch .env

# Edit with your preferred editor
nano .env
# OR
vim .env
```

#### Step 5: Verify Installation

```bash
# Run tests
pytest -q

# Check code quality
flake8 .

# Verify frontend
cd frontend && npm run build && cd ..
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# ============================================
# AI Configuration
# ============================================
# Set to 1 to use real Gemini API, 0 for mock mode
USE_REAL_GEMINI=0

# Your Google Gemini API key (required if USE_REAL_GEMINI=1)
GEMINI_API_KEY=your_api_key_here_do_not_commit

# ============================================
# Backend API Configuration
# ============================================
# Host and port for the FastAPI backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# ============================================
# Frontend Configuration
# ============================================
# Backend API URL (used by frontend)
VITE_API_URL=http://localhost:8000

# ============================================
# Logging Configuration
# ============================================
# Log level: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_LEVEL=INFO

# Log file path (optional)
LOG_FILE=cyberforge.log

# ============================================
# Output Configuration
# ============================================
# Directory for generated artifacts
OUTPUT_DIR=./output/runs

# Enable artifact compression
COMPRESS_ARTIFACTS=true
```

### Enabling Real Gemini API

#### For Current Session (Windows PowerShell):
```powershell
$env:GEMINI_API_KEY = "your_api_key_here"
$env:USE_REAL_GEMINI = "1"
```

#### For Current Session (Linux/macOS):
```bash
export GEMINI_API_KEY="your_api_key_here"
export USE_REAL_GEMINI="1"
```

#### Permanently (Windows):
```powershell
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'your_api_key_here', 'User')
[System.Environment]::SetEnvironmentVariable('USE_REAL_GEMINI', '1', 'User')
```

#### Permanently (Linux/macOS):
Add to `~/.bashrc` or `~/.zshrc`:
```bash
export GEMINI_API_KEY="your_api_key_here"
export USE_REAL_GEMINI="1"
```

### Frontend Configuration

Edit `frontend/vite.config.ts` if you need to change the development server settings:

```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 📖 Usage

### CLI Usage

The CLI is the primary interface for running the firmware generation pipeline.

#### Basic Usage

```powershell
# Activate virtual environment first
.\.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate    # Linux/macOS

# Run with an input file
python cli.py --input examples/sample_input.json
```

#### Example Input File Structure

Create a JSON file with your firmware requirements:

```json
{
  "project_name": "Temperature Monitor",
  "mcu": "STM32F103",
  "clock_speed_mhz": 72,
  "modules": [
    {
      "name": "temperature_sensor",
      "type": "sensor",
      "interface": "I2C",
      "description": "Read temperature from DHT22 sensor"
    },
    {
      "name": "display",
      "type": "output",
      "interface": "SPI",
      "description": "Display temperature on OLED screen"
    }
  ],
  "requirements": [
    "Read temperature every 5 seconds",
    "Display temperature with 0.1°C precision",
    "Log data to UART for debugging"
  ]
}
```

#### Using Example Files

```powershell
# Motor controller example
python cli.py --input examples/usecase_motor_controller.json

# Real-world complex example
python cli.py --input examples/input_real_world.json
```

#### Output Location

Generated artifacts are stored in:
```
output/runs/run_YYYYMMDD_HHMMSS/
├── architecture/    # System architecture diagrams and docs
├── code/           # Generated C/C++ firmware
├── tests/          # Unit and integration tests
├── quality/        # Quality reports and metrics
├── build/          # Compiled binaries and build logs
└── metadata.json   # Run metadata and audit trail
```

---

### API Usage

Start the FastAPI backend server:

#### Development Mode (with auto-reload)

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
cd backend_api
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or use the convenience script
python -m backend_api.main
```

#### Production Mode

```bash
uvicorn backend_api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### API Endpoints

Once running, access:

- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)
- **Health Check**: http://localhost:8000/health

#### Key Endpoints

```http
# Start a new generation job
POST /api/generate
Content-Type: application/json

{
  "project_name": "My Firmware",
  "mcu": "ESP32",
  "modules": [...]
}

# Get job status
GET /api/jobs/{job_id}

# List all jobs
GET /api/jobs

# Download artifacts
GET /api/artifacts/{job_id}/download

# Get specific artifact
GET /api/artifacts/{job_id}/{artifact_type}
```

#### Example API Usage (Python)

```python
import requests

# Start generation
response = requests.post(
    "http://localhost:8000/api/generate",
    json={
        "project_name": "LED Blinker",
        "mcu": "Arduino Uno",
        "modules": [{
            "name": "led",
            "type": "output",
            "pin": 13
        }]
    }
)

job_id = response.json()["job_id"]

# Poll for status
status_response = requests.get(f"http://localhost:8000/api/jobs/{job_id}")
print(status_response.json())
```

---

### Web UI Usage

Start both backend and frontend:

#### Step 1: Start Backend

```powershell
# Terminal 1 - Backend
.\.venv\Scripts\Activate.ps1
cd backend_api
uvicorn main:app --reload
```

#### Step 2: Start Frontend

```powershell
# Terminal 2 - Frontend
cd frontend
npm run dev
# or
pnpm dev
```

#### Step 3: Access the UI

Open your browser and navigate to:
```
http://localhost:5173
```

#### UI Features

1. **Dashboard** - Overview of recent runs and system status
2. **New Generation** - Configure and start new firmware generation
3. **Run History** - Browse past generations
4. **Artifact Viewer** - View generated code, tests, and reports
5. **Settings** - Configure AI settings and preferences

#### Using the UI

1. **Create New Project**
   - Click "New Generation"
   - Enter project details (name, MCU, clock speed)
   - Add modules using the module builder
   - Click "Generate Firmware"

2. **Monitor Progress**
   - Real-time updates via WebSocket
   - Agent status indicators
   - Log streaming

3. **View Results**
   - Click on completed run
   - Browse artifacts by type
   - Download individual files or full package
   - View quality reports and metrics

4. **Upload Configuration**
   - Click "Upload JSON"
   - Select a configuration file
   - Review and submit

---

## 🛠️ Development

### Setting Up Development Environment

```powershell
# Install all dev dependencies
pip install -r requirements-dev.txt

# Frontend development
cd frontend
npm install
npm run dev
```

### Code Style and Linting

```powershell
# Format Python code
black .

# Check code style
flake8 .

# Type checking
mypy .

# Frontend linting
cd frontend
npm run lint
```

### Project Structure Guidelines

1. **Agents** - Each agent should inherit from `BaseAgent` and implement required methods
2. **Core** - No agent-specific logic, only shared infrastructure
3. **Prompts** - Version prompts (e.g., `v1`, `v2`) and never modify old versions
4. **RAG Docs** - Keep documentation focused and well-structured
5. **Tests** - Write tests for all new features

### Adding a New Agent

```python
# agents/my_agent/agent.py
from agents.base import BaseAgent
from typing import Dict, Any

class MyAgent(BaseAgent):
    """Description of what this agent does."""
    
    def __init__(self, mcp, rag, llm_client):
        super().__init__(
            name="my_agent",
            mcp=mcp,
            rag=rag,
            llm_client=llm_client
        )
    
    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's task."""
        # 1. Validate inputs with MCP
        self.mcp.validate_input(input_data, self.name)
        
        # 2. Retrieve relevant docs from RAG
        context = self.rag.retrieve(query="my agent context")
        
        # 3. Load prompt
        prompt = self.load_prompt("my_agent_prompt_v1.md")
        
        # 4. Generate with LLM
        result = self.llm_client.generate(prompt, context)
        
        # 5. Validate output with MCP
        self.mcp.validate_output(result, self.name)
        
        return result
```

### Adding RAG Documentation

1. Create a new `.md` file in `rag_docs/`
2. Update `rag_docs/RAG_METADATA.json`:

```json
{
  "documents": [
    {
      "id": "my_doc",
      "title": "My Documentation",
      "file": "my_doc.md",
      "tags": ["hardware", "communication"],
      "embedding_model": "text-embedding-ada-002"
    }
  ]
}
```

3. Regenerate embeddings if using vector search

---

## 🧪 Testing

### Running Tests

```powershell
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_agents_gemini.py

# Run with coverage
pytest --cov=core --cov=agents --cov-report=html

# Run only unit tests (fast)
pytest -m "not integration"

# Run integration tests (requires API key)
pytest -m integration
```

### Test Structure

```
tests/
├── test_artifacts.py          # Artifact management tests
├── test_agents_gemini.py      # Agent integration tests
├── test_build_agent.py        # Build agent specific tests
├── test_orchestrator.py       # Orchestration tests
└── conftest.py                # Pytest fixtures and config
```

### Writing Tests

```python
import pytest
from core.artifacts import ArtifactManager

def test_artifact_creation(tmp_path):
    """Test creating a new artifact."""
    manager = ArtifactManager(base_dir=tmp_path)
    
    artifact = manager.create_artifact(
        type="code",
        name="main.c",
        content="int main() { return 0; }"
    )
    
    assert artifact.exists()
    assert artifact.read_text() == "int main() { return 0; }"
```

### Frontend Testing

```bash
cd frontend

# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# E2E tests (if configured)
npm run test:e2e
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: Python Virtual Environment Not Activating

**Windows PowerShell:**
```powershell
# If you get execution policy error
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then activate
.\.venv\Scripts\Activate.ps1
```

**Linux/macOS:**
```bash
# Ensure venv was created with python3
python3 -m venv .venv
source .venv/bin/activate
```

#### Issue 2: ModuleNotFoundError

```powershell
# Ensure you're in the virtual environment
# Check which Python is being used
where python  # Windows
which python  # Linux/macOS

# Reinstall dependencies
pip install -r requirements-dev.txt
```

#### Issue 3: Frontend Not Connecting to Backend

1. Check backend is running: http://localhost:8000/docs
2. Verify CORS settings in `backend_api/main.py`:
   ```python
   allow_origins=["http://localhost:3000", "http://localhost:5173"]
   ```
3. Check `VITE_API_URL` in `.env`

#### Issue 4: Port Already in Use

```powershell
# Windows - Find process using port 8000
netstat -ano | findstr :8000
# Kill process by PID
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :8000
kill -9 <PID>
```

#### Issue 5: Gemini API Errors

```powershell
# Verify API key is set
echo $env:GEMINI_API_KEY  # Windows
echo $GEMINI_API_KEY      # Linux/macOS

# Test with mock mode first
$env:USE_REAL_GEMINI = "0"
python cli.py --input examples/sample_input.json
```

### Getting Help

1. **Check Logs**
   ```powershell
   # Backend logs
   tail cyberforge.log
   
   # Frontend browser console (F12)
   ```

2. **Enable Debug Logging**
   ```env
   LOG_LEVEL=DEBUG
   ```

3. **Run Health Checks**
   ```powershell
   # Check API health
   curl http://localhost:8000/health
   
   # Check dependencies
   pip check
   ```

4. **Community Support**
   - Open an issue on GitHub
   - Check existing issues for solutions
   - Review documentation in `docs/`

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Quick Contribution Guide

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Make your changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation
4. **Run tests**
   ```bash
   pytest
   black .
   flake8 .
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add: My new feature description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/my-new-feature
   ```
7. **Create a Pull Request**

### Code Style

- **Python**: Follow PEP 8, use Black formatter
- **TypeScript**: Follow Airbnb style guide
- **Commits**: Use conventional commits format

### Review Process

1. All PRs require passing CI checks
2. Code review by at least one maintainer
3. Documentation updates required for features
4. Test coverage should not decrease

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

This project was developed as part of a hackathon submission, leveraging cutting-edge AI and embedded systems technologies.

### Technologies & Frameworks
- **Google Gemini AI** - Advanced language model for code generation
- **FastAPI** - High-performance Python web framework
- **React + Vite** - Modern frontend development stack
- **Tailwind CSS** - Utility-first CSS framework

### Special Thanks
- **HCLTech** - For Sponsoring the hackathon and Guiding through the project with Industry Expertise
- **Embedded Systems Community** - Domain knowledge and best practices
- **Open Source Contributors** - For the amazing tools and libraries

---

## 📞 Contact & Support

- **GitHub Repository**: [Cyberforce-submission-V2](https://github.com/jeeva-m-21/Cyberforce-submission-V2)
- **Issues & Bug Reports**: [GitHub Issues](https://github.com/jeeva-m-21/Cyberforce-submission-V2/issues)
- **Documentation**: [Project Docs](docs/)
- **Email**: jeeva4772@gmail.com

### Authors

- **Jeeva M** - Lead Developer - [GitHub](https://github.com/jeeva-m-21)
- **Sanjith Badri** - Core Developer
- **Krithik Vishal** - Core Developer

---

<div align="center">

**Built with ❤️ for the Embedded Systems Community**

[⬆ Back to Top](#-cyberforge-26)

</div>
