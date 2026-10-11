import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ConceptNode(Base):
    __tablename__ = "concept_nodes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    normalized_name = Column(String(255), index=True, nullable=False)
    summary = Column(Text, default="")
    category = Column(String(100), default="General")
    aliases_json = Column(Text, default="[]") # JSON list of string aliases
    difficulty_level = Column(String(50), default="intermediate") # beginner, intermediate, advanced
    source_document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    source_chunk_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workspace = relationship("Workspace", back_populates="concepts")
    outgoing_edges = relationship("ConceptEdge", foreign_keys="ConceptEdge.source_id", back_populates="source_node", cascade="all, delete-orphan")
    incoming_edges = relationship("ConceptEdge", foreign_keys="ConceptEdge.target_id", back_populates="target_node", cascade="all, delete-orphan")
    mastery_records = relationship("ConceptMastery", back_populates="concept", cascade="all, delete-orphan")
    quizzes = relationship("QuizQuestion", back_populates="concept", cascade="all, delete-orphan")

class ConceptEdge(Base):
    __tablename__ = "concept_edges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(String(36), ForeignKey("concept_nodes.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(String(36), ForeignKey("concept_nodes.id", ondelete="CASCADE"), nullable=False)
    relation_type = Column(String(100), default="relates_to") # prerequisite_of, relates_to, part_of, implements, contrasts_with
    confidence = Column(Float, default=0.85)
    rationale = Column(Text, default="")
    evidence_chunk_id = Column(String(36), nullable=True)
    evidence_quote = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workspace = relationship("Workspace", back_populates="edges")
    source_node = relationship("ConceptNode", foreign_keys=[source_id], back_populates="outgoing_edges")
    target_node = relationship("ConceptNode", foreign_keys=[target_id], back_populates="incoming_edges")
