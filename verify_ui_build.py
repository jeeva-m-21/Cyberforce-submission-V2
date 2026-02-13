#!/usr/bin/env python3
"""
CyberForge-26 UI - Project Verification Script
Checks that all required files were created successfully
"""

import os
from pathlib import Path

def check_file(path: Path, description: str) -> bool:
    """Check if a file exists"""
    exists = path.exists()
    status = "✓" if exists else "✗"
    print(f"  {status} {description}")
    return exists

def main():
    root = Path(__file__).parent
    print("\n" + "="*70)
    print("CyberForge-26 UI - Project Verification".center(70))
    print("="*70 + "\n")

    all_ok = True

    # Backend Files
    print("📦 Backend API Files:")
    all_ok &= check_file(root / "backend_api" / "main.py", "Backend server (FastAPI)")
    all_ok &= check_file(root / "backend_api" / "__init__.py", "Backend init")
    all_ok &= check_file(root / "backend_api" / "requirements.txt", "Python dependencies")

    # Frontend Files
    print("\n🎨 Frontend React Files:")
    all_ok &= check_file(root / "frontend" / "package.json", "NPM package configuration")
    all_ok &= check_file(root / "frontend" / "vite.config.ts", "Vite build config")
    all_ok &= check_file(root / "frontend" / "tailwind.config.ts", "Tailwind CSS config")
    all_ok &= check_file(root / "frontend" / "tsconfig.json", "TypeScript config")
    all_ok &= check_file(root / "frontend" / "postcss.config.js", "PostCSS config")
    all_ok &= check_file(root / "frontend" / "index.html", "HTML template")
    all_ok &= check_file(root / "frontend" / ".gitignore", "Git ignore")

    # Frontend Source
    print("\n📝 Frontend Source Code:")
    all_ok &= check_file(root / "frontend" / "src" / "main.tsx", "React entry point")
    all_ok &= check_file(root / "frontend" / "src" / "App.tsx", "Main app component")
    all_ok &= check_file(root / "frontend" / "src" / "App.css", "App styles")
    all_ok &= check_file(root / "frontend" / "src" / "index.css", "Global styles")

    # Components
    print("\n🧩 React Components:")
    all_ok &= check_file(root / "frontend" / "src" / "components" / "Layout.tsx", "Layout component")
    all_ok &= check_file(root / "frontend" / "src" / "components" / "SpecificationForm.tsx", "Specification builder")
    all_ok &= check_file(root / "frontend" / "src" / "components" / "RunsHistory.tsx", "Generation history")
    all_ok &= check_file(root / "frontend" / "src" / "components" / "Documentation.tsx", "Documentation browser")
    all_ok &= check_file(root / "frontend" / "src" / "components" / "ui.tsx", "UI components library")

    # API & State
    print("\n🔌 API & State Management:")
    all_ok &= check_file(root / "frontend" / "src" / "api" / "client.ts", "Axios API client")
    all_ok &= check_file(root / "frontend" / "src" / "store" / "generatorStore.ts", "Zustand store")

    # Documentation
    print("\n📚 Documentation Files:")
    all_ok &= check_file(root / "README_UI.txt", "UI Overview (this file)")
    all_ok &= check_file(root / "BUILD_SUMMARY.md", "Complete build summary")
    all_ok &= check_file(root / "QUICK_REFERENCE.md", "Quick reference guide")
    all_ok &= check_file(root / "UI_SETUP.md", "Detailed setup guide")
    all_ok &= check_file(root / "UI_IMPLEMENTATION.md", "Implementation details")
    all_ok &= check_file(root / "UI_VISUAL_GUIDE.md", "Visual layout guide")
    all_ok &= check_file(root / "DOCUMENTATION_INDEX.md", "Documentation index")
    all_ok &= check_file(root / "frontend" / "API_REFERENCE.md", "API reference")

    # Scripts
    print("\n⚙️ Automation Scripts:")
    all_ok &= check_file(root / "run_ui_dev.py", "Development server launcher")
    all_ok &= check_file(root / "scripts" / "setup_ui.ps1", "Setup automation script")

    # Summary
    print("\n" + "="*70)
    if all_ok:
        print("✓ All files created successfully!".center(70))
        print("\n📊 Summary:".center(70))
        print("  Backend:      3 files")
        print("  Frontend:     7 files")
        print("  Components:   5 files")
        print("  API/State:    2 files")
        print("  Docs:         8 files")
        print("  Scripts:      2 files")
        print("  ─────────────────────")
        print("  Total:        27+ files")
    else:
        print("✗ Some files are missing!".center(70))
    print("="*70 + "\n")

    # Show next steps
    print("🚀 Next Steps:\n")
    print("1. Read BUILD_SUMMARY.md for complete overview")
    print("2. Run: .\scripts\setup_ui.ps1")
    print("3. Run: python run_ui_dev.py")
    print("4. Open: http://localhost:3000\n")

    return all_ok

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
