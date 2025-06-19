#!/bin/bash

# Daraja Developer Toolkit - Development Setup Script
# Simple wrapper for common development tasks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ first."
        exit 1
    fi
    
    # Check Bun
    if ! command -v bun &> /dev/null; then
        print_warning "Bun is not installed. Installing Bun..."
        curl -fsSL https://bun.sh/install | bash
        export PATH="$HOME/.bun/bin:$PATH"
    fi
    
    print_success "Prerequisites check complete"
}

# Install all dependencies
install_deps() {
    print_step "Installing dependencies..."
    
    # Root workspace dependencies
    print_step "Installing workspace dependencies..."
    npm install
    
    # Webhook service (Bun)
    print_step "Installing webhook service dependencies..."
    cd webhook-service
    bun install
    cd ..
    
    # CLI (Python)
    print_step "Installing CLI dependencies..."
    cd cli
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        python -m venv venv
        ./venv/Scripts/activate
    else
        python3 -m venv venv
        source venv/bin/activate
    fi
    pip install -e ".[dev]"
    cd ..
    
    print_success "All dependencies installed"
}

# Start development services
start_dev() {
    print_step "Starting development services..."
    
    # Start Docker services (Redis, PostgreSQL)
    if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
        print_step "Starting Docker services..."
        docker-compose up -d
        print_success "Docker services started"
    else
        print_warning "Docker not available - services will run without persistence"
    fi
    
    # Start all Node.js services
    print_step "Starting webhook service, dashboard, and delivery worker..."
    npm run dev &
    DEV_PID=$!
    
    print_success "Development services started!"
    print_step "Services running:"
    echo "  🚀 Webhook Service: http://localhost:3001"
    echo "  🎨 Dashboard: http://localhost:3000"
    echo "  ⚡ CLI: Run 'daraja --help' in another terminal"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for interrupt
    trap "kill $DEV_PID 2>/dev/null; docker-compose down 2>/dev/null; exit" INT
    wait $DEV_PID
}

# Stop development services
stop_dev() {
    print_step "Stopping development services..."
    
    # Kill Node.js processes
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "bun.*server" 2>/dev/null || true
    
    # Stop Docker services
    docker-compose down 2>/dev/null || true
    
    print_success "Development services stopped"
}

# Show status
show_status() {
    print_step "Checking service status..."
    
    # Check if ports are in use
    if lsof -i :3000 &>/dev/null; then
        print_success "Dashboard running on port 3000"
    else
        echo "  📱 Dashboard: Not running"
    fi
    
    if lsof -i :3001 &>/dev/null; then
        print_success "Webhook service running on port 3001"
    else
        echo "  🔗 Webhook Service: Not running"
    fi
    
    # Check Docker services
    if docker-compose ps | grep -q "Up"; then
        print_success "Docker services running"
    else
        echo "  🐳 Docker Services: Not running"
    fi
    
    # Check CLI
    if cd cli && source venv/bin/activate 2>/dev/null && daraja --version &>/dev/null; then
        print_success "CLI available"
        cd ..
    else
        echo "  🔧 CLI: Not installed or not working"
    fi
}

# Test the setup
test_setup() {
    print_step "Testing the setup..."
    
    # Test webhook service
    if curl -s http://localhost:3001/health &>/dev/null; then
        print_success "Webhook service health check passed"
    else
        print_error "Webhook service health check failed"
    fi
    
    # Test dashboard
    if curl -s http://localhost:3000 &>/dev/null; then
        print_success "Dashboard accessible"
    else
        print_error "Dashboard not accessible"
    fi
    
    # Test CLI
    cd cli
    if source venv/bin/activate && daraja --help &>/dev/null; then
        print_success "CLI working"
    else
        print_error "CLI not working"
    fi
    cd ..
}

# Main command handling
case "${1:-}" in
    "setup")
        print_step "Setting up Daraja Developer Toolkit..."
        check_prerequisites
        install_deps
        print_success "Setup complete! Run './dev.sh start' to begin development."
        ;;
    "start")
        start_dev
        ;;
    "stop")
        stop_dev
        ;;
    "status")
        show_status
        ;;
    "test")
        test_setup
        ;;
    "clean")
        print_step "Cleaning up..."
        rm -rf node_modules
        rm -rf */node_modules
        rm -rf */.next
        rm -rf */dist
        rm -rf cli/venv
        docker-compose down -v 2>/dev/null || true
        print_success "Cleanup complete"
        ;;
    *)
        echo "Daraja Developer Toolkit - Development Helper"
        echo ""
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  setup   - Install all dependencies and set up the project"
        echo "  start   - Start all development services"
        echo "  stop    - Stop all development services"
        echo "  status  - Check status of all services"
        echo "  test    - Test that everything is working"
        echo "  clean   - Clean all build artifacts and dependencies"
        echo ""
        echo "Quick start:"
        echo "  ./dev.sh setup"
        echo "  ./dev.sh start"
        echo ""
        ;;
esac
