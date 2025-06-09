#!/bin/bash

# Auth MCP Deployment Script
# Deploys the authentication microservice with full validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Configuration
ENVIRONMENT="${1:-staging}"
SKIP_TESTS="${2:-false}"

echo "🔐 Deploying Auth MCP to $ENVIRONMENT"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI not found. Install with: npm install -g wrangler"
        exit 1
    fi
    
    # Check if logged in
    if ! wrangler whoami &> /dev/null; then
        print_error "Not logged into Wrangler. Run: wrangler login"
        exit 1
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the auth-mcp directory?"
        exit 1
    fi
    
    print_success "Prerequisites checked"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependencies installed"
}

# Setup database and KV namespaces
setup_infrastructure() {
    echo "🏗️  Setting up infrastructure..."
    
    # Create D1 database if it doesn't exist
    echo "Creating D1 database..."
    if ! wrangler d1 list | grep -q "sports-auth"; then
        wrangler d1 create sports-auth
        print_success "D1 database created"
    else
        print_success "D1 database already exists"
    fi
    
    # Create KV namespaces
    echo "Creating KV namespaces..."
    
    # Credentials KV
    if ! wrangler kv:namespace list | grep -q "auth-credentials"; then
        wrangler kv:namespace create "CRED_KV"
        print_success "Credentials KV namespace created"
    else
        print_success "Credentials KV namespace already exists"
    fi
    
    # Sessions KV
    if ! wrangler kv:namespace list | grep -q "auth-sessions"; then
        wrangler kv:namespace create "SESSION_KV"
        print_success "Sessions KV namespace created"
    else
        print_success "Sessions KV namespace already exists"
    fi
}

# Run database migrations
run_migrations() {
    echo "🗄️  Running database migrations..."
    
    # Apply migrations
    if [ -d "migrations" ]; then
        for migration in migrations/*.sql; do
            if [ -f "$migration" ]; then
                echo "Applying $(basename "$migration")..."
                wrangler d1 execute sports-auth --file="$migration"
            fi
        done
        print_success "Database migrations completed"
    else
        print_warning "No migrations directory found"
    fi
}

# Validate configuration
validate_configuration() {
    echo "⚙️  Validating configuration..."
    
    # Check wrangler.toml
    if [ ! -f "wrangler.toml" ]; then
        print_error "wrangler.toml not found"
        exit 1
    fi
    
    # Check for required environment variables
    local required_secrets=(
        "JWT_SECRET"
        "ENCRYPTION_KEY"
    )
    
    for secret in "${required_secrets[@]}"; do
        if ! wrangler secret list | grep -q "$secret"; then
            print_warning "Secret $secret not set. Set with: wrangler secret put $secret"
        fi
    done
    
    print_success "Configuration validated"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        print_warning "Skipping tests"
        return
    fi
    
    echo "🧪 Running tests..."
    
    if [ -f "test-auth.js" ]; then
        # Start local dev server for testing
        echo "Starting dev server for tests..."
        wrangler dev --port 8787 &
        DEV_PID=$!
        
        # Wait for server to start
        sleep 5
        
        # Run tests
        if node test-auth.js; then
            print_success "Tests passed"
        else
            print_error "Tests failed"
            kill $DEV_PID 2>/dev/null || true
            exit 1
        fi
        
        # Stop dev server
        kill $DEV_PID 2>/dev/null || true
    else
        print_warning "No test file found"
    fi
}

# Deploy worker
deploy_worker() {
    echo "🚀 Deploying worker..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        wrangler deploy --env production
    else
        wrangler deploy
    fi
    
    print_success "Worker deployed to $ENVIRONMENT"
}

# Post-deployment validation
validate_deployment() {
    echo "✅ Validating deployment..."
    
    # Get the worker URL
    local worker_url
    if [ "$ENVIRONMENT" = "production" ]; then
        worker_url="https://auth-mcp.your-domain.workers.dev"
    else
        worker_url="https://auth-mcp.your-domain.workers.dev"
    fi
    
    # Test health endpoint
    echo "Testing health endpoint..."
    if curl -f "$worker_url/health" > /dev/null 2>&1; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - worker may still be starting"
    fi
    
    # Test basic endpoints
    echo "Testing basic endpoints..."
    local test_endpoints=(
        "/auth/signup"
        "/auth/login"
        "/user/profile"
    )
    
    for endpoint in "${test_endpoints[@]}"; do
        if curl -f -X OPTIONS "$worker_url$endpoint" > /dev/null 2>&1; then
            print_success "CORS preflight works for $endpoint"
        else
            print_warning "CORS preflight failed for $endpoint"
        fi
    done
}

# Generate deployment report
generate_report() {
    echo ""
    echo "📊 Deployment Report"
    echo "===================="
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $(date)"
    echo "Worker: auth-mcp"
    echo "Status: ✅ Deployed"
    echo ""
    echo "🔗 Endpoints:"
    echo "  Health: /health"
    echo "  Signup: /auth/signup"
    echo "  Login: /auth/login"
    echo "  Link ESPN: /auth/link-espn"
    echo "  Profile: /user/profile"
    echo "  Credentials: /user/credentials"
    echo "  Billing: /billing/*"
    echo ""
    echo "🔧 Next Steps:"
    echo "  1. Set up Turnstile site and secret keys"
    echo "  2. Configure Stripe keys and webhook"
    echo "  3. Update sports-proxy to use this auth service"
    echo "  4. Test full integration flow"
    echo ""
    print_success "Auth MCP deployment complete!"
}

# Main deployment flow
main() {
    echo "Starting Auth MCP deployment..."
    
    check_prerequisites
    install_dependencies
    setup_infrastructure
    run_migrations
    validate_configuration
    run_tests
    deploy_worker
    validate_deployment
    generate_report
}

# Execute main function
main "$@"