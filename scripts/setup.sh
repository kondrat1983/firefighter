#!/bin/bash

# Firefighter Development Environment Setup Script

set -e  # Exit on any error

echo "🔥 FIREFIGHTER SETUP"
echo "===================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is installed and running
print_step "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop and try again."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker Desktop and try again."
    exit 1
fi
print_success "Docker is installed and running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install it and try again."
    exit 1
fi
print_success "Docker Compose is available"

# Create .env file if it doesn't exist
print_step "Setting up environment configuration..."
if [ ! -f .env ]; then
    print_warning ".env file not found, creating from .env.example"
    cp .env.example .env
    print_warning "Please edit .env file with your API keys before running the application"
else
    print_success ".env file already exists"
fi

# Build and start services
print_step "Building and starting services..."
echo "This may take a few minutes on first run..."

# Use docker compose (new) or docker-compose (legacy)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Stop any existing services
$COMPOSE_CMD down 2>/dev/null || true

# Build and start services
if $COMPOSE_CMD up -d --build; then
    print_success "Services built and started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for services to be healthy
print_step "Waiting for services to be ready..."

# Function to wait for a service to be healthy
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if $COMPOSE_CMD ps $service | grep -q "healthy\|running"; then
            return 0
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done
    return 1
}

# Wait for database
echo -n "Waiting for PostgreSQL"
if wait_for_service postgres; then
    print_success " PostgreSQL is ready"
else
    print_error " PostgreSQL failed to start"
    $COMPOSE_CMD logs postgres
    exit 1
fi

# Wait for Redis
echo -n "Waiting for Redis"
if wait_for_service redis; then
    print_success " Redis is ready"
else
    print_error " Redis failed to start"
    exit 1
fi

# Run database migrations
print_step "Running database migrations..."
if $COMPOSE_CMD exec -T backend alembic upgrade head; then
    print_success "Database migrations completed"
else
    print_warning "Database migrations failed - this is expected on first run"
    print_warning "You may need to create the initial migration manually"
fi

# Show service status
print_step "Service status:"
$COMPOSE_CMD ps

echo
print_success "🔥 Firefighter development environment is ready!"
echo
echo -e "${BLUE}Services:${NC}"
echo "  • Frontend (Dashboard):  http://localhost:3000"
echo "  • Backend API:          http://localhost:8000"
echo "  • API Documentation:    http://localhost:8000/docs"
echo "  • PostgreSQL:           localhost:5432"
echo "  • Redis:                localhost:6379"
echo
echo -e "${BLUE}Useful commands:${NC}"
echo "  • View logs:            $COMPOSE_CMD logs -f [service]"
echo "  • Stop services:        $COMPOSE_CMD down"
echo "  • Restart service:      $COMPOSE_CMD restart [service]"
echo "  • Run migrations:       $COMPOSE_CMD exec backend alembic upgrade head"
echo "  • Shell into backend:   $COMPOSE_CMD exec backend bash"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Edit .env file with your API keys (Reddit, Steam, Twitter, OpenAI)"
echo "  2. Visit http://localhost:3000 to access the dashboard"
echo "  3. Check the API docs at http://localhost:8000/docs"
echo
print_success "Happy bug hunting! 🐛"