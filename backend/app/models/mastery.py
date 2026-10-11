import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ConceptMastery(Base):
    __tablename__ = "concept_mastery"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    concept_id = Column(String(36), ForeignKey("concept_nodes.id", ondelete="CASCADE"), nullable=False)
    mastery_score = Column(Float, default=0.0) # 0.0 to 1.0
    confidence = Column(Float, default=0.0) # 0.0 to 1.0 based on attempt sample size
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    last_attempt_at = Column(DateTime, nullable=True)
    next_review_at = Column(DateTime, nullable=True) # Spaced repetition interval
    status = Column(String(50), default="unstarted") # unstarted, struggling, learning, mastered
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="mastery_records")
    concept = relationship("ConceptNode", back_populates="mastery_records")
