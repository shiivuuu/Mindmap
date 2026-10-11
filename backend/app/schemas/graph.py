from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ConceptNodeBase(BaseModel):
    name: str
    summary: Optional[str] = ""
    category: Optional[str] = "General"
    aliases: Optional[List[str]] = []
    difficulty_level: Optional[str] = "intermediate"

class ConceptNodeCreate(ConceptNodeBase):
    pass

class ConceptNodeUpdate(BaseModel):
    name: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    aliases: Optional[List[str]] = None
    difficulty_level: Optional[str] = None

class ConceptNodeResponse(ConceptNodeBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    workspace_id: str
    normalized_name: str
    source_document_id: Optional[str] = None
    source_chunk_id: Optional[str] = None
    created_at: datetime
    mastery_score: float = 0.0
    mastery_status: str = "unstarted"

class ConceptEdgeBase(BaseModel):
    source_id: str
    target_id: str
    relation_type: Optional[str] = "relates_to"
    confidence: Optional[float] = 0.85
    rationale: Optional[str] = ""
    evidence_chunk_id: Optional[str] = None
    evidence_quote: Optional[str] = None

class ConceptEdgeCreate(ConceptEdgeBase):
    pass

class ConceptEdgeResponse(ConceptEdgeBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    workspace_id: str
    is_verified: bool = True
    created_at: datetime

class GraphDataResponse(BaseModel):
    nodes: List[ConceptNodeResponse]
    edges: List[ConceptEdgeResponse]
    categories: List[str]
    total_nodes: int
    total_edges: int
