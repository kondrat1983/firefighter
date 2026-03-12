from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, DECIMAL, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Alert(Base):
    """Generated alerts when thresholds are met."""
    
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False, index=True)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=False, index=True)
    alert_type = Column(String(100), nullable=False, index=True)  # Same as issue_type
    status = Column(String(50), default="new", index=True)  # new, investigating, confirmed, false_alarm, known_issue
    confidence = Column(DECIMAL(3, 2), nullable=True)
    mention_count = Column(Integer, nullable=True)
    source_count = Column(Integer, nullable=True)
    ai_summary = Column(Text, nullable=True)
    suggested_title = Column(Text, nullable=True)
    suggested_investigations = Column(ARRAY(Text), default=list)
    triggered_at = Column(TIMESTAMP, server_default=func.now(), index=True)
    resolved_at = Column(TIMESTAMP, nullable=True)
    
    # Relationships
    game = relationship("Game", back_populates="alerts")
    cluster = relationship("Cluster", back_populates="alerts")
    feedback = relationship("Feedback", back_populates="alert")


class Feedback(Base):
    """Human feedback on alert accuracy."""
    
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False, index=True)
    user_id = Column(String(255), nullable=True)  # For future user management
    action = Column(String(50), nullable=False)  # confirm, false_alarm, needs_investigation
    comment = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    alert = relationship("Alert", back_populates="feedback")


class GameHealthSnapshot(Base):
    """Periodic snapshots of game health metrics."""
    
    __tablename__ = "game_health_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False, index=True)
    crash_risk = Column(DECIMAL(3, 2), nullable=True)
    progression_risk = Column(DECIMAL(3, 2), nullable=True)
    exploit_risk = Column(DECIMAL(3, 2), nullable=True)
    connectivity_risk = Column(DECIMAL(3, 2), nullable=True)
    sentiment_score = Column(DECIMAL(3, 2), nullable=True)
    overall_health = Column(DECIMAL(3, 2), nullable=True)
    patch_risk_index = Column(DECIMAL(3, 2), nullable=True)
    snapshot_time = Column(TIMESTAMP, server_default=func.now(), index=True)
    
    # Relationships
    game = relationship("Game", back_populates="health_snapshots")