# Quality Report Naming Standard - Quick Reference Card

## 📌 Standard Names

### For Current/Latest Report
```
Filename:  quality_report_latest.json
Location:  output/runs/{project_name}/reports/quality_report_latest.json
Size:      ~2-5 KB (JSON format)
Updated:   Each time quality agent runs
Purpose:   Always accessible, no parsing needed
```

### For Historical Records (Archives)
```
Pattern:   {YYYYMMDDTHHMMSSZ}_quality_agent_{UUID}.txt
Example:   20260204T194906Z_quality_agent_8700268a-49ff-4033-af9e-91fb614a0c80.txt
Location:  output/runs/{project_name}/reports/
Count:     One per generation
Purpose:   Audit trail, full history
```

### For Metadata (Tracking)
```
Pattern:   {filename}.meta.json
Example:   20260204T194906Z_quality_agent_8700268a-49ff-4033-af9e-91fb614a0c80.txt.meta.json
Location:  output/runs/{project_name}/reports/
Purpose:   Artifact metadata, timestamp, agent ID
```

---

## 🎯 Key Differences

| Feature | Latest | Archive |
|---------|--------|---------|
| **Name** | quality_report_latest.json | 20260204T194906Z_quality_agent_*.txt |
| **Length** | 26 characters | 80+ characters |
| **Update** | Every generation | Once per generation |
| **Purpose** | Current report | History |
| **Parse** | No parsing needed | Parse timestamp to sort |
| **Frontend** | Marked with ⭐ | Shows timestamp |

---

## 🔄 Access Methods

### Method 1: API (Recommended for Frontend)
```
GET http://localhost:8000/api/runs/{project}/logs

Results in:
response.quality_reports[0]    ← Latest (quality_report_latest.json)
response.quality_reports[1..] ← History (timestamped files)
```

### Method 2: Direct File System
```
# Latest
cat output/runs/{project}/reports/quality_report_latest.json

# All reports (newest first)
ls -t output/runs/{project}/reports/*.json output/runs/{project}/reports/*.txt
```

### Method 3: Command Line Script
```powershell
# Get latest report score
$latest = Get-Content output/runs/Simple_UART_Logger/reports/quality_report_latest.json | ConvertFrom-Json
$latest.overall_score

# Get all reports
Get-ChildItem output/runs/Simple_UART_Logger/reports/quality_report*.json, *.txt | Sort-Object LastWriteTime -Descending
```

---

## 📊 JSON Content Format

All quality reports contain:

```json
{
  "overall_score": 85,
  "report_type": "quality_analysis",
  "focus": "current project",
  "timestamp": "2026-02-04T19:49:06Z",
  
  "metrics": {
    "code_coverage": {
      "value": 70,
      "unit": "%",
      "target": 80,
      "status": "pass"
    },
    "cyclomatic_complexity": {
      "value": 4.2,
      "unit": "",
      "target": 5,
      "status": "pass"
    },
    "misra_violations": {
      "value": 0,
      "status": "pass"
    },
    ...
  },
  
  "analysis_summary": {
    "modules_analyzed": 4,
    "test_files_found": 2,
    "total_lines": 450,
    "llm_analysis_excerpt": "..."
  },
  
  "recommendations": [
    "Increase test coverage to 80%",
    "Reduce cyclomatic complexity in module_x",
    "Add documentation to public functions"
  ],
  
  "notes": ["Analysis complete", "...]
}
```

---

## 🎨 Frontend Display

### Report Selector Button States

```
┌─ LATEST REPORT (Selected) ─────────┐
│ ⭐ Latest Report                    │
│ Current                             │
│ Score: 85                           │
│ [Background: Purple, Text: White]   │
└─────────────────────────────────────┘

┌─ HISTORICAL REPORT (Unselected) ──┐
│ 2/4, 7:49 PM                       │
│ Score: 82                          │
│ [Background: White, Text: Gray]    │
└────────────────────────────────────┘

┌─ HISTORICAL REPORT (Unselected) ──┐
│ 2/4, 1:13 PM                       │
│ Score: 79                          │
│ [Background: White, Text: Gray]    │
└────────────────────────────────────┘
```

---

## ✅ Checklist for Reports

### Generation
- [ ] Quality agent runs successfully
- [ ] `quality_report_latest.json` created
- [ ] Timestamped file created (archive)
- [ ] Metadata sidecar created

### Storage
- [ ] File in: `output/runs/{project}/reports/`
- [ ] File format: Valid JSON
- [ ] File readable without errors
- [ ] Size: 2-5 KB typical

### API
- [ ] GET endpoint returns 200 OK
- [ ] `quality_reports` array included
- [ ] First item: Latest report
- [ ] Data field: Valid JSON parsed

### Frontend
- [ ] Quality Report tab loads
- [ ] Latest marked with ⭐
- [ ] Score displays correctly
- [ ] Can select other reports

---

## 🐛 Troubleshooting

### Latest file not created?
```
✓ Check: Quality agent ran (check logs)
✓ Check: reports/ directory exists
✓ Check: Write permissions
✓ Check: No errors in backend logs
```

### Can't find reports?
```
✓ Path: output/runs/{project}/reports/
✓ Not: output/runs/{project}/quality_report/
✓ File: Has .json or .txt extension
✓ Check: File is not empty
```

### API returns empty array?
```
✓ Check: Reports directory has files
✓ Check: Files are .json or .txt
✓ Check: Files contain valid JSON
✓ Check: Backend was restarted
```

### Frontend shows N/A?
```
✓ Check: Browser cache (Ctrl+Shift+R)
✓ Check: Backend running on :8000
✓ Check: API returns quality_reports
✓ Check: Browser console for errors
```

---

## 🔗 Quick Links

| Resource | Purpose |
|----------|---------|
| [Full Spec](QUALITY_REPORT_NAMING.md) | Complete documentation |
| [Implementation](QUALITY_NAMING_IMPLEMENTATION.md) | Technical details |
| [Diagrams](QUALITY_NAMING_FLOW_DIAGRAM.md) | Visual reference |
| [Checklist](QUALITY_NAMING_CHECKLIST.md) | Verification steps |
| [Status](QUALITY_NAMING_STATUS.md) | Current status |

---

## 📝 Examples

### Example 1: Get Latest Score from API
```python
import requests

response = requests.get('http://localhost:8000/api/runs/Simple_UART_Logger/logs')
latest_report = response.json()['quality_reports'][0]
score = latest_report['data']['overall_score']
print(f"Score: {score}")  # Output: Score: 85
```

### Example 2: Read Latest from Disk
```python
import json
from pathlib import Path

report_path = Path('output/runs/Simple_UART_Logger/reports/quality_report_latest.json')
with open(report_path) as f:
    data = json.load(f)
    print(f"Score: {data['overall_score']}")  # Output: Score: 85
```

### Example 3: List All Reports
```powershell
$reports = Get-ChildItem output/runs/Simple_UART_Logger/reports -Filter "quality_report*"
$reports | Sort-Object LastWriteTime -Descending | ForEach-Object { Write-Host $_.Name }

# Output:
# quality_report_latest.json
# 20260204T194906Z_quality_agent_8700268a.txt
# 20260204T181341Z_quality_agent_b6a938c9.txt
```

---

## 🎓 Summary

**Latest Report**: Use `quality_report_latest.json` for current  
**History**: Use timestamped files for audit trail  
**API**: Always returns latest first  
**Frontend**: Shows ⭐ for latest  
**Simple**: No parsing needed for standard name  

**Status**: ✅ Ready to use. Just restart backend!
