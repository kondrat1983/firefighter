# Firefighter Development Commands

.PHONY: help setup start stop logs clean test migrate seed reset

# Default target
help:
	@echo "🔥 Firefighter Development Commands"
	@echo "=================================="
	@echo ""
	@echo "Setup & Environment:"
	@echo "  make setup     - Initial setup (run once)"
	@echo "  make start     - Start all services"
	@echo "  make stop      - Stop all services"
	@echo "  make clean     - Stop and remove containers"
	@echo ""
	@echo "Development:"
	@echo "  make logs      - View all service logs"
	@echo "  make logs-api  - View backend API logs"
	@echo "  make logs-ui   - View frontend logs"
	@echo "  make shell     - Open shell in backend container"
	@echo ""
	@echo "Database:"
	@echo "  make migrate   - Run database migrations"
	@echo "  make seed      - Add sample data"
	@echo "  make reset-db  - Reset database (destructive!)"
	@echo ""
	@echo "Testing:"
	@echo "  make test      - Run all tests"
	@echo "  make test-api  - Run backend tests"
	@echo "  make lint      - Run code linting"
	@echo ""

# Setup development environment
setup:
	@echo "🔥 Setting up Firefighter development environment..."
	./scripts/setup.sh

# Start services
start:
	@echo "🚀 Starting Firefighter services..."
	docker compose up -d

# Stop services
stop:
	@echo "⏹️  Stopping Firefighter services..."
	docker compose down

# Clean environment
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker compose down -v --remove-orphans
	docker system prune -f

# View logs
logs:
	docker compose logs -f

logs-api:
	docker compose logs -f backend

logs-ui:
	docker compose logs -f frontend

logs-worker:
	docker compose logs -f worker beat

# Database operations
migrate:
	@echo "📊 Running database migrations..."
	docker compose exec backend alembic upgrade head

seed:
	@echo "🌱 Seeding database with sample data..."
	python3 scripts/db-setup.py seed

reset-db:
	@echo "⚠️  Resetting database..."
	python3 scripts/db-setup.py reset
	docker compose exec backend alembic upgrade head

# Development tools
shell:
	docker compose exec backend bash

shell-db:
	docker compose exec postgres psql -U firefighter -d firefighter

# Testing
test:
	@echo "🧪 Running all tests..."
	docker compose exec backend pytest
	cd frontend && npm test

test-api:
	docker compose exec backend pytest

lint:
	@echo "🔍 Running linters..."
	docker compose exec backend black app/ --check
	docker compose exec backend isort app/ --check-only
	cd frontend && npm run lint

format:
	@echo "🎨 Formatting code..."
	docker compose exec backend black app/
	docker compose exec backend isort app/
	cd frontend && npm run format

# Health checks
health:
	@echo "🏥 Checking service health..."
	@echo "API Health:"
	curl -s http://localhost:8000/health | jq . || echo "API not responding"
	@echo ""
	@echo "Frontend:"
	curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && echo " Frontend OK" || echo " Frontend not responding"
	@echo ""
	@echo "Services:"
	docker compose ps

# Quick development cycle
dev: stop start logs

# Production build
build:
	@echo "🏗️  Building production images..."
	docker compose build --no-cache