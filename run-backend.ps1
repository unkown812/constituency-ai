#!/usr/bin/env pwsh
#Requires -Version 7.0

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $PSCommandPath
$BackendDir = Join-Path $ScriptDir "backend" "api"
$InfraDir = Join-Path $ScriptDir "infra" "docker"
$WorkerDir = Join-Path $ScriptDir "backend" "worker"

function Log  { Write-Host "[INFO] $($args -join ' ')" -ForegroundColor Cyan }
function Ok   { Write-Host "[OK]   $($args -join ' ')" -ForegroundColor Green }
function Warn { Write-Host "[WARN] $($args -join ' ')" -ForegroundColor Yellow }
function Err  { Write-Host "[ERROR] $($args -join ' ')" -ForegroundColor Red; exit 1 }

function CheckDeps {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) { Err "Docker not found. Install from https://docs.docker.com/get-docker/" }

    $compose = docker compose version 2>&1
    if (-not $compose) { Err "Docker Compose v2 not available. Update Docker." }

    Ok "Docker + Docker Compose found"
}

function SetupEnv {
    $envFile = Join-Path $BackendDir ".env"
    $envExample = Join-Path $BackendDir ".env.example"
    if (-not (Test-Path $envFile)) {
        Warn ".env file not found at $envFile"
        Log "Creating from .env.example..."
        Copy-Item $envExample $envFile
        Warn "Edit $envFile to fill in required values (SUPABASE_URL, SUPABASE_KEY, etc.)"
    } else {
        Ok ".env file found"
    }
}

function ShowMenu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Constituency AI — Backend Launcher   " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1) Full stack — Docker Compose (API + Worker + AI services + infra)"
    Write-Host "2) Infra only — Docker Compose (PostGIS, Redis, Qdrant only)"
    Write-Host "3) Full stack — Docker Compose (production mode from infra/)"
    Write-Host "4) Run Alembic migrations"
    Write-Host "5) Start Celery worker (run after 'infra only')"
    Write-Host "0) Exit"
    Write-Host ""
}

function RunFullDev {
    Log "Starting full backend (API, Worker, AI services + PostGIS, Redis, Qdrant)..."
    Push-Location $BackendDir
    docker compose up --build -d
    Pop-Location
    Ok "All services started. API at http://localhost:8000/docs"
    Log "Tail logs with: docker compose -f $BackendDir/docker-compose.yml logs -f"
}

function RunInfraOnly {
    Log "Starting infrastructure services (PostGIS, Redis, Qdrant)..."
    Push-Location $BackendDir
    docker compose up --build -d db redis qdrant
    Pop-Location
    Ok "Infra services started. PostGIS:5432  Redis:6379  Qdrant:6333"

    $venvDir = Join-Path $BackendDir "venv"
    if (-not (Test-Path $venvDir)) {
        Log "Creating Python virtual environment..."
        python -m venv $venvDir
    }

    Log "Installing API dependencies..."
    & (Join-Path $venvDir "Scripts" "Activate.ps1")
    pip install -e $BackendDir --quiet

    Log "Running Alembic migrations..."
    Push-Location $BackendDir
    alembic upgrade head
    Pop-Location

    Log "Starting API via uvicorn (hot-reload)..."
    $apiJob = Start-Job -ScriptBlock {
        param($bd, $vd)
        & (Join-Path $vd "Scripts" "Activate.ps1")
        Push-Location $bd
        uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    } -ArgumentList $BackendDir, $venvDir

    Ok "API running at http://localhost:8000/docs (Job ID: $($apiJob.Id))"
    Log "Run option 5 in another terminal to start the Celery worker"
    Log "Press Ctrl+C to stop"
    $apiJob | Wait-Job
}

function RunProd {
    Log "Starting production stack..."
    Push-Location $InfraDir
    docker compose -f docker-compose.prod.yml up --build -d
    Pop-Location
    Ok "Production stack started."
}

function RunMigrations {
    Log "Running Alembic migrations..."
    $venvDir = Join-Path $BackendDir "venv"
    if (-not (Test-Path $venvDir)) {
        python -m venv $venvDir
    }
    & (Join-Path $venvDir "Scripts" "Activate.ps1")
    pip install -e $BackendDir --quiet
    Push-Location $BackendDir
    alembic upgrade head
    Pop-Location
    Ok "Migrations applied"
}

function RunWorker {
    Log "Starting Celery worker..."
    $venvDir = Join-Path $BackendDir "venv"
    if (-not (Test-Path $venvDir)) {
        python -m venv $venvDir
    }
    & (Join-Path $venvDir "Scripts" "Activate.ps1")
    pip install -e $BackendDir --quiet
    Push-Location $WorkerDir
    celery -A celery_app worker --loglevel=info
    Pop-Location
}

CheckDeps
SetupEnv

do {
    ShowMenu
    $choice = Read-Host "Select option [0-5]"
    switch ($choice) {
        "1" { RunFullDev; break }
        "2" { RunInfraOnly; break }
        "3" { RunProd; break }
        "4" { RunMigrations }
        "5" { RunWorker; break }
        "0" { Log "Exiting."; exit }
        default { Warn "Invalid option. Please enter a number 0-5." }
    }
} while ($true)
