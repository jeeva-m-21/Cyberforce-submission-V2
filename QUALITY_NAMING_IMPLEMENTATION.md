# Quality Report Naming Standard Implementation

## Summary

Implemented a standardized naming convention for quality reports that makes them easy to access at runtime while preserving full historical records.

## Changes Made

### 1. Backend: Quality Report Latest File ([backend_api/main.py](backend_api/main.py))
- Modified `/api/runs/{run_id}/logs` endpoint to prioritize `quality_report_latest.json`
- Returns reports array with latest file first, followed by timestamped archives
- Clean access path: `reports/quality_report_latest.json`

### 2. Artifact Generation ([core/artifacts.py](core/artifacts.py))
- Added automatic creation of `quality_report_latest.json` after quality agent generates report
- Preserves timestamped archive: `{TIMESTAMP}_quality_agent_{uuid}.txt`
- Creates metadata sidecar: `{filename}.meta.json` for all reports

### 3. Frontend Display ([frontend/src/components/QualityReportViewer.tsx](frontend/src/components/QualityReportViewer.tsx))
- Latest report displays as "⭐ Latest Report" with timestamp "Current"
- Historical reports show formatted timestamps
- Easy visual distinction between current and archived reports

## Naming Standard

### Directory Structure
```
output/runs/{project_name}/reports/
├── quality_report_latest.json          ← Standardized latest (updated each generation)
├── 20260204T194906Z_quality_agent_*.txt   ← Archive 1 (oldest)
├── 20260205T093400Z_quality_agent_*.txt   ← Archive 2
└── 20260205T101530Z_quality_agent_*.txt   ← Archive 3 (newest before latest)
```

### File Naming
- **Latest**: `quality_report_latest.json` (simple, consistent name)
- **Archive**: `{YYYYMMDDTHHMMSSZ}_quality_agent_{uuid}.txt` (unique, timestamped)
- **Metadata**: `{filename}.meta.json` (tracking and audit trail)

## Runtime Access

### Concise Access at API Level
```python
# Backend automatically serves latest report first
GET /api/runs/{project_name}/logs

# Response includes quality_reports array:
{
  "quality_reports": [
    {
      "filename": "quality_report_latest.json",
      "path": "...",
      "data": {...overall_score, metrics, recommendations...}
    },
    {
      "filename": "20260204T194906Z_quality_agent_*.txt",
      "path": "...",
      "data": {...}
    }
  ]
}
```

### Frontend Display
1. **Latest Report** (always first in array)
   - Shows as "⭐ Latest Report"
   - Easy to identify current version

2. **Historical Reports** (remaining array elements)
   - Shows formatted timestamp
   - Allows audit trail access

## Benefits

✅ **Simple Naming**: Just use `quality_report_latest.json` for current report  
✅ **Concise Access**: No need to parse timestamps at runtime  
✅ **Full History**: Timestamped files preserved for audit trail  
✅ **Clear Intent**: Star icon (⭐) makes latest obvious  
✅ **Scalable**: Works with any number of historical reports  
✅ **Backward Compatible**: Old projects still work (auto-sorts by mtime)  

## Files Modified

1. **[backend_api/main.py](backend_api/main.py)**
   - Updated `/api/runs/{run_id}/logs` endpoint
   - Prioritizes `quality_report_latest.json`
   - Falls back to timestamped files

2. **[core/artifacts.py](core/artifacts.py)**
   - Added auto-creation of `quality_report_latest.json`
   - Only triggers for quality_agent + reports type
   - Added logging import for error handling

3. **[frontend/src/components/QualityReportViewer.tsx](frontend/src/components/QualityReportViewer.tsx)**
   - Updated report selector display
   - Special handling for "quality_report_latest.json" filename
   - Shows "⭐ Latest Report" with "Current" timestamp

## Documentation

- See [QUALITY_REPORT_NAMING.md](QUALITY_REPORT_NAMING.md) for full specification
- See [test_quality_reports.ps1](test_quality_reports.ps1) for testing script

## Next Steps

1. **Restart Backend**: Changes take effect immediately on restart
2. **Generate New Project**: Quality agent will now create `quality_report_latest.json`
3. **Check Results**: Frontend will show "⭐ Latest Report" in Quality tab
4. **Test Script**: Run `./test_quality_reports.ps1` to verify directory structure

## Testing

```powershell
# Verify quality report naming
./test_quality_reports.ps1

# Test API endpoint
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/runs/Simple_UART_Logger/logs"
$response.quality_reports | ForEach-Object { Write-Host $_.filename }
```

Expected output:
```
quality_report_latest.json
20260204T194906Z_quality_agent_8700268a-49ff-4033-af9e-91fb614a0c80.txt
20260204T181341Z_quality_agent_b6a938c9-561b-4390-a9fb-4838139a137f.txt
...
```
