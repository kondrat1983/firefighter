# Firefighter - Bug Radar for Live Games

Firefighter is a zero-setup QA intelligence tool that monitors public community sources and detects early signs of live issues before they escalate internally.

## Quick Start

1. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Start Development Environment**
   ```bash
   docker-compose up -d
   ```

3. **Run Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   alembic upgrade head
   uvicorn app.main:app --reload
   ```

4. **Run Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Architecture

- **Backend**: FastAPI + PostgreSQL + Redis + Celery
- **Frontend**: Next.js 13+ with TypeScript
- **Data Pipeline**: Async workers for collection and processing
- **Real-time**: WebSocket connections for live updates

## Development

See `FIREFIGHTER_MVP_SPEC.md` for detailed requirements and specifications.

### Project Structure
```
firefighter/
├── backend/          # FastAPI application
├── frontend/         # Next.js dashboard
├── scripts/          # Setup and utility scripts
└── docker-compose.yml # Development environment
```

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## Dashboard

The mission control dashboard is available at `http://localhost:3000`.