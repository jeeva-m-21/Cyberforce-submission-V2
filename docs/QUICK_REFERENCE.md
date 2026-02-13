# CyberForge-26 UI - Quick Reference Card

## Installation (One-Time)

```powershell
# Option 1: Automated Setup
.\scripts\setup_ui.ps1

# Option 2: Manual Setup
python -m pip install fastapi uvicorn python-multipart
cd frontend && npm install && cd ..
```

## Running the Application

```powershell
# Start both servers automatically
python run_ui_dev.py

# OR manually start:
# Terminal 1:
python backend_api/main.py

# Terminal 2:
cd frontend && npm run dev
```

Then open: **http://localhost:3000**

---

## Key Directories

| Path | Purpose |
|------|---------|
| `backend_api/` | FastAPI server |
| `frontend/` | React application |
| `frontend/src/components/` | UI components |
| `frontend/src/api/` | API client |
| `frontend/src/store/` | State management |

---

## Frontend Ports

| Port | Service | URL |
|------|---------|-----|
| 3000 | React Dev Server | http://localhost:3000 |
| 3001+ | HMR Port | Auto-assigned |

## Backend Ports

| Port | Service | URL |
|------|---------|-----|
| 8000 | FastAPI Server | http://localhost:8000 |
| 8001 | Alternative | http://localhost:8001 |

---

## Commands

### Development
```powershell
# Frontend development
cd frontend
npm run dev        # Start dev server with HMR
npm run build      # Production build
npm run preview    # Preview production build

# Backend
python backend_api/main.py    # Start server
python -m pytest              # Run tests
```

### Maintenance
```powershell
# Update dependencies
npm update -g          # Update npm
npm upgrade            # Upgrade packages
pip install --upgrade  # Upgrade pip packages

# Clean
rm -r frontend/dist/    # Remove build
rm -r frontend/node_modules/  # Remove dependencies
rm -r __pycache__/      # Remove Python cache
```

---

## Environment Variables

### Frontend (.env.local)
```bash
VITE_API_URL=http://localhost:8000/api
```

### Backend (from main project)
```bash
GEMINI_API_KEY=your-api-key
USE_REAL_GEMINI=1
```

---

## File Structure at a Glance

```
Cyberforce-submission-V2/
├── backend_api/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   └── __init__.py
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api/             # API client
│   │   ├── store/           # State management
│   │   ├── App.tsx          # Main component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Styles
│   ├── package.json         # NPM deps
│   ├── vite.config.ts       # Build config
│   ├── tailwind.config.ts   # CSS config
│   └── index.html           # HTML template
│
├── UI_SETUP.md              # Setup guide
├── UI_IMPLEMENTATION.md     # Feature docs
├── UI_VISUAL_GUIDE.md       # Layout guide
├── BUILD_SUMMARY.md         # This summary
├── run_ui_dev.py            # Dev launcher
└── scripts/
    └── setup_ui.ps1         # Setup script
```

---

## API Endpoints (Quick Reference)

```
POST   /api/generate              Start firmware generation
GET    /api/runs                  List all runs
GET    /api/runs/{run_id}         Get run status
GET    /api/templates             List templates
GET    /api/docs/rag              Get RAG docs
GET    /api/output/{run_id}/{path} Download artifacts
GET    /health                    Health check
```

---

## Troubleshooting Quick Fixes

### Port In Use
```powershell
# Windows - Kill port 8000
$proc = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($proc) { Stop-Process -Id $proc.OwningProcess -Force }
```

### API Not Connecting
1. Check backend: http://localhost:8000/health
2. Check frontend console (F12)
3. Check CORS in `backend_api/main.py`

### Dependencies Issue
```powershell
# Python
pip install --force-reinstall -r backend_api/requirements.txt

# Node
cd frontend && npm ci && cd ..
```

### Port Conflicts
```powershell
# Change frontend port in frontend/vite.config.ts
server: {
  port: 3001  # Change from 3000
}

# Change backend port in backend_api/main.py
uvicorn.run(app, port=8001)  # Change from 8000
```

---

## Git Integration

```powershell
# Add UI files to version control
git add frontend/ backend_api/ UI_*.md BUILD_SUMMARY.md run_ui_dev.py

# Gitignore patterns
*.log
*.pyc
__pycache__/
.env.local
node_modules/
dist/
.venv/
```

---

## Performance Tips

### Frontend
- Use React DevTools for component profiling
- Check Network tab for API call times
- Monitor bundle size: `npm run build`

### Backend
- Use FastAPI Swagger UI at http://localhost:8000/docs
- Check response times with browser DevTools
- Monitor async task queue

---

## Learning Path

1. **Start Here:** `UI_VISUAL_GUIDE.md`
2. **Setup:** `UI_SETUP.md`
3. **Use:** Open http://localhost:3000
4. **Understand:** `UI_IMPLEMENTATION.md`
5. **Integrate:** `frontend/API_REFERENCE.md`
6. **Develop:** Modify `frontend/src/` files

---

## Common Tasks

### Add a New Component
```typescript
// Create frontend/src/components/NewComponent.tsx
import React from 'react'
import { Card, Button } from './ui'

export function NewComponent() {
  return (
    <Card>
      <h1>My Component</h1>
      <Button>Click Me</Button>
    </Card>
  )
}

// Use in App.tsx
import { NewComponent } from './components/NewComponent'
```

### Add a New API Endpoint
```python
# Add to backend_api/main.py
@app.get("/api/new-endpoint")
async def new_endpoint():
    return {"status": "success"}

# Add to frontend/src/api/client.ts
newEndpoint: () => api.get<YourType>('/new-endpoint'),
```

### Change Styling
```typescript
// Edit frontend/tailwind.config.ts for global changes
// Edit component className for local changes
// All Tailwind classes available for styling
```

---

## Support Resources

| Resource | Location |
|----------|----------|
| API Docs | http://localhost:8000/docs |
| Setup | UI_SETUP.md |
| Implementation | UI_IMPLEMENTATION.md |
| API Reference | frontend/API_REFERENCE.md |
| Visual Guide | UI_VISUAL_GUIDE.md |
| Build Summary | BUILD_SUMMARY.md |

---

## One-Liner Start

```powershell
.\scripts\setup_ui.ps1; python run_ui_dev.py
```

Then visit: **http://localhost:3000** 🚀

---

**Last Updated:** February 4, 2026
