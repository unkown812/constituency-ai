#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend/api"
INFRA_DIR="$SCRIPT_DIR/infra/docker"
WORKER_DIR="$SCRIPT_DIR/backend/worker"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }

cleanup() {
    log "Shutting down Docker Compose services..."
    docker compose -f "$BACKEND_DIR/docker-compose.yml" down 2>/dev/null || true
}
trap cleanup EXIT

check_deps() {
    if ! command -v docker &>/dev/null; then
        err "Docker is not installed. Install it from https://docs.docker.com/get-docker/"
        exit 1
    fi
    if ! docker compose version &>/dev/null; then
        err "Docker Compose is not available. Update Docker to a version that includes Compose v2."
        exit 1
    fi
    ok "Docker + Docker Compose found"
}

setup_env() {
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        warn ".env file not found at $BACKEND_DIR/.env"
        log "Creating from .env.example..."
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        warn "Edit $BACKEND_DIR/.env to fill in required values (SUPABASE_URL, SUPABASE_KEY, etc.)"
    else
        ok ".env file found"
    fi
}

show_menu() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}   Constituency AI — Backend Launcher   ${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    echo "1) Full stack — Docker Compose (API + Worker + AI services + infra)"
    echo "2) Infra only — Docker Compose (PostGIS, Redis, Qdrant only)"
    echo "3) Full stack — Docker Compose (production mode from infra/)"
    echo "4) Run Alembic migrations"
    echo "5) Start Celery worker (run after 'infra only')"
    echo "0) Exit"
    echo ""
}

run_full_dev() {
    log "Starting full backend (API, Worker, AI services + PostGIS, Redis, Qdrant)..."
    cd "$BACKEND_DIR"
    docker compose up --build -d
    ok "All services started. API at http://localhost:8000/docs"
    log "Tail logs with: docker compose -f $BACKEND_DIR/docker-compose.yml logs -f"
}

run_infra_only() {
    log "Starting infrastructure services (PostGIS, Redis, Qdrant)..."
    cd "$BACKEND_DIR"
    docker compose up --build -d db redis qdrant
    ok "Infra services started. PostGIS:5432  Redis:6379  Qdrant:6333"

    log "Starting API via uvicorn (hot-reload)..."
    cd "$BACKEND_DIR"
    if [ ! -d "venv" ]; then
        log "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -e . --quiet
    alembic upgrade head
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    API_PID=$!
    ok "API running at http://localhost:8000/docs (PID: $API_PID)"
    log "Run 'source $BACKEND_DIR/venv/bin/activate && celery -A $WORKER_DIR/celery_app worker --loglevel=info' in another terminal"
    wait $API_PID
}

run_prod() {
    log "Starting production stack..."
    cd "$INFRA_DIR"
    docker compose -f docker-compose.prod.yml up --build -d
    ok "Production stack started."
}

run_migrations() {
    log "Running Alembic migrations..."
    if [ ! -d "$BACKEND_DIR/venv" ]; then
        cd "$BACKEND_DIR"
        python3 -m venv venv
        source venv/bin/activate
        pip install -e . --quiet
    else
        source "$BACKEND_DIR/venv/bin/activate"
    fi
    cd "$BACKEND_DIR"
    alembic upgrade head
    ok "Migrations applied"
}

run_worker() {
    log "Starting Celery worker..."
    if [ ! -d "$BACKEND_DIR/venv" ]; then
        cd "$BACKEND_DIR"
        python3 -m venv venv
        source venv/bin/activate
        pip install -e . --quiet
    else
        source "$BACKEND_DIR/venv/bin/activate"
    fi
    cd "$WORKER_DIR"
    celery -A celery_app worker --loglevel=info
}

main() {
    check_deps
    setup_env

    while true; do
        show_menu
        read -rp "Select option [0-5]: " choice
        case "$choice" in
            1) run_full_dev; break ;;
            2) run_infra_only; break ;;
            3) run_prod; break ;;
            4) run_migrations ;;
            5) run_worker; break ;;
            0) log "Exiting."; exit 0 ;;
            *) warn "Invalid option. Please enter a number 0-5." ;;
        esac
    done
}

main
