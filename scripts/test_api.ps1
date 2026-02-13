# Test the updated API endpoint
$url = "http://localhost:8000/api/runs/Simple_UART_Logger/logs"

try {
    Write-Host "Testing API endpoint: $url"
    $response = Invoke-RestMethod -Uri $url -Method Get
    
    Write-Host "`n✓ SUCCESS!"
    Write-Host "Quality Reports Count: $($response.quality_reports.Count)"
    Write-Host "`nReports:"
    
    $response.quality_reports | ForEach-Object {
        Write-Host "  - Filename: $($_.filename)"
        Write-Host "    Score: $($_.data.overall_score)"
        Write-Host ""
    }
} catch {
    Write-Host "`n✗ Error: $($_.Exception.Message)"
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode.value__)"
}
