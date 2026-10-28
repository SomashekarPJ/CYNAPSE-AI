@echo off
echo ============================================
echo   CYNAPSE AI - Installing All Dependencies
echo ============================================
echo.

REM Activate virtual environment
call c:\backend\envo\Scripts\activate.bat

echo [1/3] Installing core FastAPI stack...
pip install fastapi uvicorn python-dotenv aiosqlite python-multipart pydantic websockets

echo.
echo [2/3] Installing AI and NLP libraries...
pip install groq google-generativeai beautifulsoup4 httpx imagehash Pillow

echo.
echo [3/3] Installing Playwright and browser...
pip install playwright
playwright install chromium

echo.
echo ============================================
echo   All dependencies installed successfully!
echo ============================================
echo.
echo To start the server, run:
echo   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo.
pause
