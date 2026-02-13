# Load .env variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
        if ($name -in @('USE_REAL_GEMINI', 'GEMINI_API_KEY', 'GEMINI_MODEL')) {
            Write-Host "Set $name" -ForegroundColor Cyan
        }
    }
}

Write-Host "`nStarting backend with Gemini enabled..." -ForegroundColor Green
Write-Host "USE_REAL_GEMINI = $env:USE_REAL_GEMINI" -ForegroundColor Yellow
Write-Host ""

.venv\Scripts\python.exe -m uvicorn backend_api.main:app --reload --port 8000
