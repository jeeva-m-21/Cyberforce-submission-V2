# Run this after installing Git to initialize the repo and make the first commit
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git is not found in PATH. Install Git for Windows: https://git-scm.com/download/win and rerun."
  exit 1
}

git init -b main
git add .
git commit -m "chore: initial scaffold"
Write-Host "Repository initialized and initial commit created."
