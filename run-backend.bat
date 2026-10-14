@echo off
title Constituency AI — Backend Launcher
cd /d "%~dp0"

set BACKEND_DIR=%~dp0backend\api
set SUPABASE_MSG=

echo ========================================
echo    Constituency AI - Backend Launcher
echo ========================================
echo.

REM ---- Check Docker ----
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker not found. Please install Docker Desktop from:
    echo         https://docs.docker.com/get-docker/
    echo.
    pause
    exit /b 1
)

docker compose version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker Compose v2 not available. Update Docker Desktop.
    echo.
    pause
    exit /b 1
)
echo [OK] Docker + Docker Compose found
echo.

REM ---- Setup .env ----
if not exist "%BACKEND_DIR%\.env" (
    echo [WARN] .env file not found at %BACKEND_DIR%\.env
    if exist "%BACKEND_DIR%\.env.example" (
        copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
        echo [INFO] Created .env from .env.example
        echo [WARN] Open %BACKEND_DIR%\.env and fill in:
        echo        - SUPABASE_URL
        echo        - SUPABASE_KEY
        echo        - SUPABASE_JWT_SECRET
        echo        - JWT_SECRET
        echo.
        set SUPABASE_MSG=1
    ) else (
        echo [ERROR] No .env.example found at %BACKEND_DIR%\.env.example
        pause
        exit /b 1
    )
) else (
    echo [OK] .env file found
)
echo.

REM ---- Start full dev stack ----
echo [INFO] Starting full backend (API, Worker, AI services + PostGIS, Redis, Qdrant)...
echo.
cd /d "%BACKEND_DIR%"
docker compose up --build -d

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Docker Compose failed. Check error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    All services started successfully!
echo ========================================
echo.
echo    API:        http://localhost:8000/docs
echo    PostGIS:    localhost:5432
echo    Redis:      localhost:6379
echo    Qdrant:     localhost:6333
echo.

if defined SUPABASE_MSG (
    echo [IMPORTANT] Don't forget to configure %BACKEND_DIR%\.env
    echo             with your Supabase credentials before using auth/storage.
    echo.
)

echo [INFO] Tail logs: docker compose -f "%BACKEND_DIR%\docker-compose.yml" logs -f
echo [INFO] Stop:      docker compose -f "%BACKEND_DIR%\docker-compose.yml" down
echo.

REM ---- Open browser ----
echo [INFO] Opening API docs in your browser...
start http://localhost:8000/docs

echo.
pause
