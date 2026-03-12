from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, DECIMAL, ARRAY, Text, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base

# Association table for many-to-many relationship between clusters and signals
cluster_signals = Table(
    'cluster_signals',
    Base.metadata,
    Column('cluster_id', Integer, ForeignKey('clusters.id'), primary_key=True),
    Column('signal_id', Integer, ForeignKey('raw_signals.id'), primary_key=True),
    Column('similarity_score', DECIMAL(3, 2), nullable=True)
)


class Cluster(Base):
    """Clustered signals grouped by semantic similarity."""
    
    __tablename__ = "clusters"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False, index=True)
    cluster_label = Column(String(255), nullable=True)
    issue_type = Column(String(100), nullable=True, index=True)  # crash, progression, exploit, connectivity, sentiment
    confidence = Column(DECIMAL(3, 2), nullable=True)  # 0.00-1.00
    signal_count = Column(Integer, default=1, index=True)
    first_seen = Column(TIMESTAMP, server_default=func.now())
    last_updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True, index=True)
    representative_phrases = Column(ARRAY(Text), default=list)
    
    # Relationships
    game = relationship("Game", back_populates="clusters")
    signals = relationship("RawSignal", secondary=cluster_signals, back_populates="clusters")
    alerts = relationship("Alert", back_populates="cluster")