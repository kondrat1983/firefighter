from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.database import Base


class RawSignal(Base):
    """Raw signals collected from various sources."""
    
    __tablename__ = "raw_signals"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False, index=True)
    source_type = Column(String(50), nullable=False, index=True)  # reddit, steam, twitter, facebook
    source_id = Column(String(255), nullable=False, index=True)  # Platform-specific ID
    source_url = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    author = Column(String(255), nullable=True)
    timestamp = Column(TIMESTAMP, nullable=False, index=True)
    metadata = Column(JSON, nullable=True)  # Source-specific data
    processed = Column(Boolean, default=False, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    game = relationship("Game", back_populates="signals")
    embedding = relationship("SignalEmbedding", back_populates="signal", uselist=False)
    clusters = relationship("Cluster", secondary="cluster_signals", back_populates="signals")


class SignalEmbedding(Base):
    """Embeddings for semantic similarity search."""
    
    __tablename__ = "signal_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    signal_id = Column(Integer, ForeignKey("raw_signals.id"), nullable=False, unique=True)
    embedding = Column(Vector(1536))  # OpenAI ada-002 embedding size
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    signal = relationship("RawSignal", back_populates="embedding")