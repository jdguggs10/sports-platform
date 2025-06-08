#!/bin/bash

# Sports Platform v3.2 - Development Server Startup Script
# Starts all required services for testing and development

set -e

echo "🚀 Starting Sports Platform v3.2 Development Servers..."
echo

# Check if concurrently is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js and npm."
    exit 1
fi

# Create log directory
mkdir -p logs

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local name=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    echo "   ⏳ Waiting for $name on port $port..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "http://localhost:$port/health" >/dev/null 2>&1; then
            echo "   ✅ $name is ready"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 1
    done
    
    echo "   ❌ $name failed to start within 30 seconds"
    return 1
}

# Check required ports
echo "🔍 Checking port availability..."
PORTS_OK=true

if ! check_port 8081; then
    PORTS_OK=false
fi
if ! check_port 8782; then
    PORTS_OK=false
fi
if ! check_port 8783; then
    PORTS_OK=false
fi

if [ "$PORTS_OK" = false ]; then
    echo
    echo "❌ Some required ports are in use. Please stop conflicting services:"
    echo "   Port 8081: Sports Proxy"
    echo "   Port 8782: Baseball Stats MCP"
    echo "   Port 8783: Hockey Stats MCP"
    echo
    echo "You can kill processes on these ports with:"
    echo "   kill \$(lsof -ti:8081,8782,8783)"
    exit 1
fi

echo "✅ All ports available"
echo

# Start services using concurrently
echo "🎯 Starting all services..."
echo

# Install concurrently if not present
if ! npm list concurrently >/dev/null 2>&1; then
    echo "📦 Installing concurrently..."
    npm install --save-dev concurrently
fi

# Start services in background
npx concurrently \
    --prefix "{name}" \
    --names "proxy,hockey,baseball" \
    --prefix-colors "cyan,green,yellow" \
    --kill-others-on-fail \
    "cd workers/sports-proxy && npm run dev" \
    "cd workers/hockey-stats-mcp && npm run dev" \
    "cd workers/baseball-stats-mcp && npm run dev" \
    > logs/dev-servers.log 2>&1 &

DEV_PID=$!
echo "🔄 Services starting in background (PID: $DEV_PID)..."

# Wait for all services to be ready
echo
echo "⏳ Waiting for services to be ready..."

if wait_for_service "Sports Proxy" 8081 && \
   wait_for_service "Hockey Stats MCP" 8783 && \
   wait_for_service "Baseball Stats MCP" 8782; then
    
    echo
    echo "🎉 All services are ready!"
    echo
    echo "📋 Service Status:"
    echo "   ✅ Sports Proxy:      http://localhost:8081/health"
    echo "   ✅ Hockey Stats MCP:  http://localhost:8783/health"  
    echo "   ✅ Baseball Stats MCP: http://localhost:8782/health"
    echo
    echo "🧪 Ready for testing:"
    echo "   npm test                    # Run all tests"
    echo "   npm run test:quick         # Quick CI check"
    echo "   npm run test:architecture  # Deep architectural validation"
    echo
    echo "📊 Monitor logs:"
    echo "   tail -f logs/dev-servers.log"
    echo
    echo "🛑 Stop services:"
    echo "   kill $DEV_PID"
    echo "   # Or use: npm run stop"
    
    # Save PID for stop script
    echo $DEV_PID > .dev-servers.pid
    
else
    echo
    echo "❌ Some services failed to start. Check logs:"
    echo "   tail logs/dev-servers.log"
    
    # Kill the background process
    kill $DEV_PID 2>/dev/null || true
    exit 1
fi