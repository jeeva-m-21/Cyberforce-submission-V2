# ForgeMCU Studio (Frontend)

Quick start (Windows / PowerShell):

```powershell
cd frontend
# install deps (use npm or yarn)
npm install
# start dev server
npm run dev
```

Open http://localhost:5173 (or the Vite URL printed in the terminal).

Notes:
- The UI polls the backend at `/api` for runs and health checks. Set `localStorage.apiBaseUrl` to a different base if your API runs elsewhere.
- Shortcuts: `Ctrl/Cmd+1..5` toggle tabs. Single keys: `g` Generate, `r` Results, `f` Files, `l` Build Log, `q` Quality.
- Dark mode persists via `localStorage.theme`.
