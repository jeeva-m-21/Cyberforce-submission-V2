@echo off
echo Starting CyberForge-26 Development Environment...
echo.

REM Start backend in new window
echo Starting Backend (FastAPI on port 8000)...
start "CyberForge Backend" cmd /k python backend_api/main.py

REM Wait a moment for backend to start
timeout /t 2 /nobreak

REM Start frontend in new window
echo Starting Frontend (React on port 3000)...
cd frontend
start "CyberForge Frontend" cmd /k npm run dev

echo.
echo ✓ Both servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause
