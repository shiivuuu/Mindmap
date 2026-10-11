from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class WorkspaceBase(BaseModel):
    title: str
    description: Optional[str] = ""

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class WorkspaceResponse(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class WorkspaceDetail(WorkspaceResponse):
    document_count: int = 0
    concept_count: int = 0
    quiz_count: int = 0
