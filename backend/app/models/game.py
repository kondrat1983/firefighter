from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ARRAY, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Game(Base):
    """Game model for monitored games."""
    
    __tablename__ = "games"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    aliases = Column(ARRAY(String), default=list)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True, index=True)
    current_patch_release = Column(TIMESTAMP, nullable=True)
    monitoring_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    signals = relationship("RawSignal", back_populates="game")
    clusters = relationship("Cluster", back_populates="game")
    alerts = relationship("Alert", back_populates="game")
    health_snapshots = relationship("GameHealthSnapshot", back_populates="game")