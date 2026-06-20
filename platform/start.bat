@echo off
REM Double-click launcher for Windows. Installs deps + database on first run,
REM then starts the platform and opens it in your browser.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org then run this again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies, this can take a couple of minutes...
  call npm install
)
if not exist prisma\dev.db (
  echo Setting up the database from config.yaml...
  call npm run setup
)

echo Opening http://localhost:3000 ...
start "" http://localhost:3000
call npm run dev
