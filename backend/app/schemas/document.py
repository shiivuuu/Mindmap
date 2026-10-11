from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class DocumentBase(BaseModel):
    title: str

class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    workspace_id: str
    file_name: str
    file_type: str
    file_size_bytes: int
    status: str
    error_message: Optional[str] = None
    chunk_count: int
    page_count: int
    created_at: datetime
    updated_at: datetime

class ChunkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    document_id: str
    chunk_index: int
    text: str
    page_number: int
    section_title: Optional[str] = None
    created_at: datetime

class DocumentDetail(DocumentResponse):
    chunks: List[ChunkResponse] = []
