#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status

# Directories
REPO_ROOT=$(pwd)
LLM_DIR="$REPO_ROOT/trigram_llm"
API_DIR="$REPO_ROOT/trigram_api"
FRONTEND_DIR="$REPO_ROOT/trigram_frontend_api"

# Functions
print_step() {
    echo -e "\n\033[0;36m==> $1\033[0m"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "Error: '$1' could not be found. Please install it."
        exit 1
    fi
}

# 1. Check tools
print_step "Checking build tools..."
check_command make
check_command npm
check_command gcc

# 2. Build trigram_llm
print_step "Building trigram_llm..."
cd "$LLM_DIR"
make

# 3. Train model if needed
MODEL_PATH="$LLM_DIR/output/model.bin"
if [ ! -f "$MODEL_PATH" ]; then
    print_step "Training trigram language model..."
    mkdir -p "$(dirname "$MODEL_PATH")"
    ./trigram_llm --train
else
    echo "Model already exists at $MODEL_PATH. Skipping training."
fi

# 4. Build trigram_api
print_step "Building trigram_api..."
cd "$API_DIR"
make

# 5. Install frontend dependencies
print_step "Checking frontend dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing node_modules..."
    npm install
else
    echo "node_modules exists. Skipping install."
fi

# 6. Start services
print_step "Starting services..."

trap 'kill $(jobs -p) 2>/dev/null' SIGINT SIGTERM EXIT # Kill background jobs on exit

# Start English text backend (port 8080)
cd "$API_DIR"
echo "Starting English text API server (port 8080)..."
./trigram_api -m ../trigram_llm/output/model.bin -p 8080 &
BACKEND_PID=$!

# Start Python code backend (port 8081)
echo "Starting Python code API server (port 8081)..."
./trigram_api -m ../trigram_llm/output_py/model.bin -p 8081 &
CODE_BACKEND_PID=$!

# Wait a moment for backends to initialize
sleep 2

# Start format server
cd "$FRONTEND_DIR"
echo "Starting code format server (port 5001)..."
node format_server.js &
FORMAT_PID=$!

# Start frontend
echo "Starting frontend dev server..."
npm run dev &
FRONTEND_PID=$!

echo -e "\n\033[0;32mAll services started!\033[0m"
echo -e "English Text API: http://localhost:8080"
echo -e "Python Code API:  http://localhost:8081"
echo -e "Format Server:    http://localhost:5001"
echo -e "Frontend:         http://localhost:3000"
echo -e "\nRoutes:"
echo -e "  /            - Trigram Language Model (English)"
echo -e "  /code-editor - Python Code Editor"
echo -e "\nPress Ctrl+C to stop all services.\n"

wait $BACKEND_PID $CODE_BACKEND_PID $FORMAT_PID $FRONTEND_PID

