import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    concept_id = Column(String(36), ForeignKey("concept_nodes.id", ondelete="CASCADE"), nullable=False)
    prompt = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False) # JSON list of strings
    correct_index = Column(Integer, nullable=False)
    rationale = Column(Text, default="")
    difficulty = Column(String(50), default="medium") # easy, medium, hard
    source_chunk_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workspace = relationship("Workspace", back_populates="quizzes")
    concept = relationship("ConceptNode", back_populates="quizzes")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    score_pct = Column(Float, default=0.0)
    answers_json = Column(Text, default="[]") # JSON list of objects: [{question_id, selected_index, is_correct, concept_id}]
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="quiz_attempts")
    workspace = relationship("Workspace", back_populates="quiz_attempts")
