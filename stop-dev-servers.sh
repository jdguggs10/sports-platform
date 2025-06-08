#!/bin/bash

# Sports Platform v3.2 - Development Server Shutdown Script
# Gracefully stops all development services

set -e

echo "🛑 Stopping Sports Platform v3.2 Development Servers..."

# Check if PID file exists
if [ -f .dev-servers.pid ]; then
    DEV_PID=$(cat .dev-servers.pid)
    
    if ps -p $DEV_PID > /dev/null 2>&1; then
        echo "   ⏹️  Stopping services (PID: $DEV_PID)..."
        kill $DEV_PID
        
        # Wait for graceful shutdown
        sleep 2
        
        # Force kill if still running
        if ps -p $DEV_PID > /dev/null 2>&1; then
            echo "   🔨 Force stopping services..."
            kill -9 $DEV_PID 2>/dev/null || true
        fi
        
        echo "   ✅ Services stopped"
    else
        echo "   ⚠️  Services not running (PID $DEV_PID not found)"
    fi
    
    # Clean up PID file
    rm -f .dev-servers.pid
else
    echo "   ⚠️  No PID file found, attempting to kill by port..."
    
    # Kill processes on known ports
    PORTS="8081 8782 8783"
    for port in $PORTS; do
        PID=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$PID" ]; then
            echo "   🔨 Killing process on port $port (PID: $PID)"
            kill $PID 2>/dev/null || true
        fi
    done
fi

# Verify all ports are free
echo
echo "🔍 Verifying ports are free..."
PORTS_FREE=true

for port in 8081 8782 8783; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   ⚠️  Port $port still in use"
        PORTS_FREE=false
    else
        echo "   ✅ Port $port is free"
    fi
done

if [ "$PORTS_FREE" = true ]; then
    echo
    echo "🎉 All development servers stopped successfully!"
    echo "   Ready to restart with: ./start-dev-servers.sh"
else
    echo
    echo "⚠️  Some ports may still be in use. You can force kill with:"
    echo "   kill \$(lsof -ti:8081,8782,8783)"
fi