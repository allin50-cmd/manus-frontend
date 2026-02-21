#!/bin/bash

# ============================================================================
# Local Azure Deployment Test Script
# ============================================================================
# This script automates testing the FineGuard app locally using Docker Compose,
# simulating the Azure deployment environment.
#
# Usage: ./test-local-deployment.sh [command]
# Commands:
#   start     - Start Docker services (default)
#   stop      - Stop Docker services
#   restart   - Restart Docker services
#   logs      - Show app logs
#   health    - Check app health
#   db-reset  - Reset database (removes volumes)
#   clean     - Stop and remove everything
#
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Commands
cmd_start() {
    print_header "Starting Local Azure Deployment"

    if docker-compose --version > /dev/null 2>&1; then
        print_success "Docker Compose is available"
    else
        print_error "Docker Compose not found. Install from: https://docs.docker.com/compose/install/"
        exit 1
    fi

    echo ""
    echo "Building and starting services..."
    docker-compose up --build -d

    print_success "Services started"
    echo ""

    # Wait for services to be ready
    echo "Waiting for PostgreSQL to be healthy..."
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U vaultline > /dev/null 2>&1; then
            print_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL failed to start"
            exit 1
        fi
        sleep 1
    done

    echo ""
    echo "Initializing database..."
    docker-compose exec -T app npm run db:push

    echo ""
    echo "Waiting for app to be ready..."
    sleep 3

    # Check health
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        print_success "Application is healthy"
    else
        print_warning "Application health check pending (it may still be starting)"
    fi

    echo ""
    print_header "Deployment Ready"
    echo ""
    echo "Services running:"
    echo "  • Frontend: http://localhost:8080"
    echo "  • API: http://localhost:8080/api/*"
    echo "  • PostgreSQL: localhost:5432"
    echo ""
    echo "Commands:"
    echo "  View logs: $0 logs"
    echo "  Check health: $0 health"
    echo "  Stop services: $0 stop"
    echo ""
    echo "For more details, see: LOCAL_DEPLOYMENT.md"
}

cmd_stop() {
    print_header "Stopping Services"
    docker-compose down
    print_success "Services stopped"
}

cmd_restart() {
    print_header "Restarting Services"
    cmd_stop
    sleep 2
    cmd_start
}

cmd_logs() {
    print_header "Application Logs"
    docker-compose logs -f app
}

cmd_health() {
    print_header "Health Check"

    echo "Checking app health..."
    if curl -s http://localhost:8080/api/health | jq . 2>/dev/null; then
        print_success "Application is healthy"
    else
        print_error "Application health check failed"
        echo ""
        echo "Checking service status..."
        docker-compose ps
        exit 1
    fi
}

cmd_db_reset() {
    print_header "Resetting Database"
    print_warning "This will DELETE all data and recreate the database"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        print_success "Database reset complete"
        echo ""
        echo "Start services again with: $0 start"
    else
        echo "Cancelled"
    fi
}

cmd_clean() {
    print_header "Cleaning Up"
    print_warning "This will stop all services, remove containers, volumes, and images"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v --rmi all
        print_success "Cleanup complete"
    else
        echo "Cancelled"
    fi
}

cmd_help() {
    cat << EOF
Local Azure Deployment Test Script

Usage: $0 [command]

Commands:
    start       Start Docker services and initialize database (default)
    stop        Stop Docker services
    restart     Stop and start services
    logs        Show application logs
    health      Check application health
    db-reset    Reset database (removes volumes)
    clean       Remove all containers, volumes, and images
    help        Show this help message

Examples:
    $0                  # Start services
    $0 logs             # Watch logs
    $0 health           # Check health
    $0 stop             # Stop services

For detailed documentation, see: LOCAL_DEPLOYMENT.md
EOF
}

# Main
COMMAND="${1:-start}"

case "$COMMAND" in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    logs)
        cmd_logs
        ;;
    health)
        cmd_health
        ;;
    db-reset)
        cmd_db_reset
        ;;
    clean)
        cmd_clean
        ;;
    help|-h|--help)
        cmd_help
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        echo ""
        cmd_help
        exit 1
        ;;
esac
