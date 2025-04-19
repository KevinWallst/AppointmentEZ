@echo off
echo Checking for processes using port 3000...

REM Find and kill processes using port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process with PID: %%a
    taskkill /F /PID %%a
)

echo Starting server on port 3000...
set PORT=3000
npm run dev
