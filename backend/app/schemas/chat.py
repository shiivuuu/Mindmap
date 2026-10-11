from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class CitationItem(BaseModel):
    document_id: str
    document_title: str
    page_number: int
    chunk_id: str
    quote: str
    relevance_score: float

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    session_id: str
    sender: str
    content: str
    citations: List[CitationItem] = []
    insufficient_evidence: bool = False
    latency_ms: Optional[int] = None
    created_at: datetime

class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Research Session"

class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    workspace_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    last_message_preview: Optional[str] = None
    message_count: int = 0

class ChatSessionDetail(ChatSessionResponse):
    messages: List[ChatMessageResponse] = []
