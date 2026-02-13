#!/usr/bin/env powershell
# Setup script for CyberForge-26 UI
# Run: .\scripts\setup_ui.ps1

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     CyberForge-26 UI Setup Script                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Check Python
Write-Host "`n[1/4] Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "`n[2/4] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found! Please install Node.js 16+" -ForegroundColor Red
    exit 1
}

# Install Python dependencies
Write-Host "`n[3/4] Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install --upgrade pip
python -m pip install fastapi uvicorn python-multipart
Write-Host "✓ Python dependencies installed" -ForegroundColor Green

# Install frontend dependencies
Write-Host "`n[4/4] Installing frontend dependencies..." -ForegroundColor Yellow
cd frontend
npm install
cd ..
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ ✓ Setup Complete!                                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📖 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Read UI_SETUP.md for detailed configuration" -ForegroundColor White
Write-Host "2. Run: python run_ui_dev.py" -ForegroundColor White
Write-Host "3. Open: http://localhost:3000" -ForegroundColor White
Write-Host "`n"
