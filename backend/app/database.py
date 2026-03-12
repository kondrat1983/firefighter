from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Convert sync DATABASE_URL to async format for asyncpg
async_database_url = str(settings.DATABASE_URL).replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
async_engine = create_async_engine(
    async_database_url,
    echo=False,  # Set to True for SQL query logging
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    async_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Create sync engine for migrations
sync_engine = create_engine(str(settings.DATABASE_URL))

# Base class for models
Base = declarative_base()

async def get_async_session() -> AsyncSession:
    """Dependency to get async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()