# Quality Report Naming Standard

## Overview
Quality reports are now organized with a standardized naming convention for easy access and runtime retrieval.

## Naming Convention

### Primary Access Path
- **Standardized Name**: `quality_report_latest.json`
- **Location**: `output/runs/{project_name}/reports/quality_report_latest.json`
- **Purpose**: Always points to the most recent quality report
- **Usage**: Frontend displays this as "⭐ Latest Report"

### Historical Archive
- **Timestamped Files**: `{TIMESTAMP}_{agent_id}_{uuid}.txt`
- **Example**: `20260204T194906Z_quality_agent_8700268a-49ff-4033-af9e-91fb614a0c80.txt`
- **Pattern**: `YYYYMMDDTHHMMSSZ_quality_agent_{uuid}.txt`
- **Purpose**: Full history of all generated quality reports

## File Format
All quality reports contain valid JSON:
```json
{
  "overall_score": 85,
  "report_type": "quality_analysis",
  "metrics": {
    "code_coverage": {"value": 70, "unit": "%", "status": "pass"},
    "cyclomatic_complexity": {"value": 4.2, "unit": "", "status": "pass"}
  },
  "analysis_summary": {...},
  "recommendations": [...]
}
```

## Backend Access Strategy

1. **API Endpoint**: `GET /api/runs/{run_id}/logs`
2. **Returns**:
   - `quality_reports[0]` → `quality_report_latest.json` (if exists)
   - `quality_reports[1-N]` → Timestamped reports (sorted by modification time, newest first)

## Frontend Display

### Quality Report Viewer Tab
- **Card 1**: Latest Report (marked with ⭐)
  - Filename: "⭐ Latest Report"
  - Timestamp: "Current"
  - Score: Extracted from JSON
  
- **Cards 2+**: Historical Reports (optional)
  - Filename: Extracted timestamp formatted as readable date
  - Score: Extracted from JSON

### Results Summary
- Always uses the first report in the array (latest)
- Shows count indicator: "(X reports available)" when history exists

## Automatic Creation

When quality agent generates a report:

1. **Write Archive File**
   - Creates timestamped file: `20260204T194906Z_quality_agent_{uuid}.txt`
   - Creates metadata sidecar: `{filename}.meta.json`

2. **Create Latest Symlink**
   - Automatically creates/updates `quality_report_latest.json`
   - Points to latest generated report content
   - Same directory: `reports/`

## Runtime Access

### Path Resolution Order
```python
# 1. Check for standardized latest
latest_standardized = reports_dir / "quality_report_latest.json"
if latest_standardized.exists():
    # Use this as primary
    
# 2. Fallback to timestamped files
all_reports = [p for p in reports_dir.iterdir() 
               if p.suffix in [".json", ".txt"]
               and p.name != "quality_report_latest.json"]
all_reports.sort(key=mtime, reverse=True)
```

## Benefits

✅ **Concise Runtime Access**: Always use `quality_report_latest.json` for current report  
✅ **Full History Preserved**: All timestamped files available for audit trail  
✅ **Clear Naming**: "Latest" marker makes it obvious which is current  
✅ **No Breaking Changes**: Timestamped files still generated for backward compatibility  
✅ **Easy Scripting**: Simple filename without needing to parse timestamps  

## Migration

For existing projects with only timestamped files:
- Backend automatically sorts by modification time
- First file returned = most recent report
- Subsequent generations will create `quality_report_latest.json`
