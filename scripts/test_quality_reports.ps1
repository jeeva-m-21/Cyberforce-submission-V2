#!/usr/bin/env powershell
# Test the new standardized quality report naming
# Usage: ./test_quality_reports.ps1

$projectName = "Simple_UART_Logger"  # Change as needed
$reportsDir = "output/runs/$projectName/reports"

Write-Host "`n=== Quality Report Naming Standard Test ===" -ForegroundColor Cyan

if (-not (Test-Path $reportsDir)) {
    Write-Host "❌ Reports directory not found: $reportsDir" -ForegroundColor Red
    exit 1
}

Write-Host "`n📁 Reports Directory: $reportsDir" -ForegroundColor Green

# Check for latest standardized file
$latestFile = Join-Path $reportsDir "quality_report_latest.json"
if (Test-Path $latestFile) {
    Write-Host "✅ Latest Report File: quality_report_latest.json" -ForegroundColor Green
    $size = (Get-Item $latestFile).Length
    Write-Host "   Size: $size bytes"
    
    # Verify it's valid JSON
    try {
        $content = Get-Content $latestFile -Raw | ConvertFrom-Json
        Write-Host "   Overall Score: $($content.overall_score)" -ForegroundColor Yellow
    } catch {
        Write-Host "   ⚠️ Invalid JSON format" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Latest report file not found" -ForegroundColor Yellow
}

# List all timestamped reports
Write-Host "`n📋 Historical Reports (Timestamped):" -ForegroundColor Cyan
$timestamped = Get-ChildItem $reportsDir -Filter "*quality_agent*.txt" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending

if ($timestamped.Count -eq 0) {
    Write-Host "   No timestamped reports found" -ForegroundColor Gray
} else {
    $timestamped | ForEach-Object {
        $time = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        $size = $_.Length
        Write-Host "   • $($_.Name)" -ForegroundColor Green
        Write-Host "     Modified: $time | Size: $size bytes" -ForegroundColor Gray
    }
}

Write-Host "`n✅ Test Complete" -ForegroundColor Green
Write-Host "Run the API endpoint: GET http://localhost:8000/api/runs/$projectName/logs" -ForegroundColor Cyan
