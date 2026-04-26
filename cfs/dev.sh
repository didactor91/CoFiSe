#!/bin/bash
# Dev environment startup script
# Usage: ./dev.sh [server|client|all]

set -e

cd /home/didac/Seno-Com/cfs

# Kill existing processes on relevant ports
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
}

# Wait for port to be available
wait_for_port() {
    local port=$1
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if lsof -ti :$port >/dev/null 2>&1; then
            return 0
        fi
        sleep 0.5
        attempt=$((attempt + 1))
    done
    return 1
}

start_server() {
    echo "Starting server on port 4000..."
    cd /home/didac/Seno-Com/cfs/server
    kill_port 4000
    pnpm dev > /tmp/server.log 2>&1 &
    SERVER_PID=$!
    echo "Server PID: $SERVER_PID"
    
    if wait_for_port 4000; then
        echo "Server started successfully on port 4000"
    else
        echo "ERROR: Server failed to start on port 4000"
        cat /tmp/server.log
        return 1
    fi
}

start_client() {
    echo "Starting client on port 5173..."
    cd /home/didac/Seno-Com/cfs/client
    kill_port 5173
    pnpm dev -- --port 5173 > /tmp/client.log 2>&1 &
    CLIENT_PID=$!
    echo "Client PID: $CLIENT_PID"
    
    if wait_for_port 5173; then
        echo "Client started successfully on port 5173"
    else
        echo "ERROR: Client failed to start on port 5173"
        cat /tmp/client.log
        return 1
    fi
}

stop_all() {
    echo "Stopping all dev processes..."
    kill_port 4000
    kill_port 5173
    pkill -f "tsx.*watch" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo "All processes stopped"
}

case "${1:-all}" in
    server)
        start_server
        ;;
    client)
        start_client
        ;;
    stop)
        stop_all
        ;;
    all)
        start_server
        sleep 2
        start_client
        echo ""
        echo "=== ENVIRONMENT READY ==="
        echo "Server:   http://localhost:4000"
        echo "Client:   http://localhost:5173"
        echo "API Proxy: http://localhost:5173/api/graphql"
        echo ""
        echo "Admin:    http://localhost:5173/admin/competitions"
        ;;
    *)
        echo "Usage: ./dev.sh [server|client|all|stop]"
        exit 1
        ;;
esac
