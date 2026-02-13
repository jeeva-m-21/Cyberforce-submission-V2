#!/usr/bin/env python3
"""
Simple development server launcher for CyberForge-26 UI
Launches both backend API and frontend dev server
"""

import subprocess
import sys
import time
import os
from pathlib import Path

def run_command(cmd, shell=False, cwd=None):
    """Run a command and return the process"""
    print(f"Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    return subprocess.Popen(
        cmd,
        shell=shell,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

def main():
    root = Path(__file__).parent
    backend_api = root / "backend_api" / "main.py"
    frontend = root / "frontend"

    # Check if files exist
    if not backend_api.exists():
        print(f"Error: {backend_api} not found")
        sys.exit(1)
    
    if not frontend.exists():
        print(f"Error: {frontend} not found")
        sys.exit(1)

    print("=" * 60)
    print("CyberForge-26 UI Development Server")
    print("=" * 60)

    # Start backend API
    print("\n[1/2] Starting FastAPI backend on http://localhost:8000")
    backend_proc = run_command(
        [sys.executable, str(backend_api)],
        cwd=root
    )

    # Wait for backend to start
    time.sleep(3)

    # Start frontend
    print("[2/2] Starting React frontend on http://localhost:3000")
    print("(This may take a moment on first run)\n")
    
    frontend_proc = run_command(
        "npm run dev",
        shell=True,
        cwd=frontend
    )

    print("=" * 60)
    print("✓ Servers started!")
    print("  Backend:  http://localhost:8000")
    print("  Frontend: http://localhost:3000")
    print("  API Docs: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop")
    print("=" * 60 + "\n")

    try:
        while True:
            time.sleep(1)
            # Check if processes are still running
            if backend_proc.poll() is not None:
                print("Backend process exited!")
            if frontend_proc.poll() is not None:
                print("Frontend process exited!")
    except KeyboardInterrupt:
        print("\n\nShutting down...")
        backend_proc.terminate()
        frontend_proc.terminate()
        
        try:
            backend_proc.wait(timeout=5)
            frontend_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_proc.kill()
            frontend_proc.kill()
        
        print("Servers stopped.")
        sys.exit(0)

if __name__ == "__main__":
    main()
