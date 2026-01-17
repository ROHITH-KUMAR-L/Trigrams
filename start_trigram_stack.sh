#!/bin/bash

# Exit on error
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKIP_TRAIN=false
SKIP_FRONTEND_INSTALL=false

# Simple flag parsing
for arg in "$@"; do
    case $arg in
        --skip-train) SKIP_TRAIN=true ;;
        --skip-frontend-install) SKIP_FRONTEND_INSTALL=true ;;
    esac
done

echo -e "\e[36m==> Environment: Linux/WSL\e[0m"

# ------------------ BUILD & TRAIN LLM ------------------
LLM_DIR="$REPO_ROOT/trigram_llm"
LLM_EXE="$LLM_DIR/trigram_llm"

cd "$LLM_DIR"
if [ ! -f "$LLM_EXE" ]; then
    echo -e "\e[36m==> Building trigram_llm\e[0m"
    make
fi

if [ "$SKIP_TRAIN" = false ]; then
    MODEL_PATH="$LLM_DIR/output/model.bin"
    if [ ! -f "$MODEL_PATH" ]; then
        mkdir -p "$(dirname "$MODEL_PATH")"
        echo -e "\e[36m==> Training trigram language model\e[0m"
        "$LLM_EXE" --train
    else
        echo -e "\e[33mModel already exists. Skipping training.\e[0m"
    fi
fi

# ------------------ BUILD API SERVER ------------------
API_DIR="$REPO_ROOT/trigram_api"
API_EXE="$API_DIR/trigram_api"

cd "$API_DIR"
# Check for libmicrohttpd
if ! pkg-config --exists libmicrohttpd; then
    echo -e "\e[33mWarning: libmicrohttpd-dev might be missing. If build fails, run: sudo apt install libmicrohttpd-dev\e[0m"
fi

if [ ! -f "$API_EXE" ]; then
    echo -e "\e[36m==> Building trigram_api\e[0m"
    make
fi

# ------------------ FRONTEND PREP ------------------
FRONTEND_DIR="$REPO_ROOT/trigram_frontend_api"

if [ "$SKIP_FRONTEND_INSTALL" = false ]; then
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo -e "\e[36m==> Installing frontend dependencies\e[0m"
        cd "$FRONTEND_DIR" && npm install
    fi
fi

# ------------------ START SERVICES ------------------
echo -e "\e[32mStarting services in background...\e[0m"

BACKEND_LOG="$API_DIR/backend.log"
FRONTEND_LOG="$FRONTEND_DIR/frontend.log"

# Start Backend
echo "Starting Backend (Logging to $BACKEND_LOG)..."
cd "$API_DIR"
nohup ./trigram_api > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend (Logging to $FRONTEND_LOG)..."
cd "$FRONTEND_DIR"
nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

echo -e "\e[32m\nAll services launched successfully:\e[0m"
echo "  Backend  (PID $BACKEND_PID) → http://localhost:8080 (Log: $BACKEND_LOG)"
echo "  Frontend (PID $FRONTEND_PID) → http://localhost:3000 (Log: $FRONTEND_LOG)"
echo -e "\e[33m\nTo stop services, use: kill $BACKEND_PID $FRONTEND_PID or pkill trigram_api; pkill node\033[0m"
