# PowerShell setup script (Windows)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt

# Set PYTHONPATH to workspace root for this session (enables imports for tests and scripts)
$env:PYTHONPATH = (Get-Location).Path

Write-Host "Virtual env created, dev dependencies installed, and PYTHONPATH set. Activate with: .\.venv\Scripts\Activate.ps1"
