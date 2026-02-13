# Quality Reports - Standardized Naming Summary

## What Changed

Quality reports now use a **standardized naming convention** that makes them easy to access at runtime while maintaining full historical records.

## The Standard

### What You See in Frontend
```
⭐ Latest Report  [Current]  Score: 85
20260204T194906Z  [2/5/2026, 7:49 PM]  Score: 82
20260204T181341Z  [2/5/2026, 1:13 PM]  Score: 79
```

### What's on Disk
```
reports/
├── quality_report_latest.json              ← Always the newest (simple name)
├── 20260204T194906Z_quality_agent_*.txt    ← Archive 1
├── 20260204T181341Z_quality_agent_*.txt    ← Archive 2
└── ... (more historical files)
```

## How It Works

### Generation (Automatic)
1. Quality agent generates report with UUID
2. Saves as: `20260204T194906Z_quality_agent_{uuid}.txt`
3. **Automatically creates**: `quality_report_latest.json` (same content)
4. Creates metadata: `{filename}.meta.json`

### Access (Backend API)
```
GET /api/runs/Simple_UART_Logger/logs

Returns:
{
  "quality_reports": [
    {
      "filename": "quality_report_latest.json",  ← Latest first
      "data": {...}
    },
    {
      "filename": "20260204T194906Z_quality_agent_*.txt",
      "data": {...}
    },
    ...
  ]
}
```

### Display (Frontend)
- **First report** = Latest (marked with ⭐)
- **Other reports** = History (if available)
- All show score and timestamp

## Key Benefits

| Benefit | Before | After |
|---------|--------|-------|
| **Runtime Access** | Parse UUID+timestamp | Use `quality_report_latest.json` |
| **Visual Clarity** | All look the same | ⭐ marks the latest |
| **History** | Scattered timestamps | Sorted by time, newest first |
| **Scripting** | Complex filename parsing | Simple standard name |
| **Backward Compat** | N/A | Old projects still work |

## Files Changed

✅ **[backend_api/main.py](backend_api/main.py)**
- Prioritizes `quality_report_latest.json` in API response

✅ **[core/artifacts.py](core/artifacts.py)**
- Auto-creates `quality_report_latest.json` after generation

✅ **[frontend/src/components/QualityReportViewer.tsx](frontend/src/components/QualityReportViewer.tsx)**
- Displays latest report as "⭐ Latest Report"

## Test It

### Check the reports directory:
```powershell
cd output/runs/Simple_UART_Logger/reports
dir
# Should show:
# - quality_report_latest.json (new!)
# - 20260204T194906Z_quality_agent_*.txt
# - 20260204T194906Z_quality_agent_*.txt.meta.json
```

### Test the API:
```powershell
$response = Invoke-RestMethod http://localhost:8000/api/runs/Simple_UART_Logger/logs
$response.quality_reports[0].filename
# Output: quality_report_latest.json
```

### Check the Frontend:
1. Generate a project
2. Go to Quality Report tab
3. See "⭐ Latest Report" as first option

## No Action Needed

This update is **backward compatible**. Old projects continue to work:
- Existing timestamped files are still accessible
- New generations create the standardized `quality_report_latest.json`
- Just restart your backend to load the changes

---

**Documentation**: See [QUALITY_REPORT_NAMING.md](QUALITY_REPORT_NAMING.md) for complete specification
