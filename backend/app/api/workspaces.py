from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_for_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document
from app.models.graph import ConceptNode
from app.models.quiz import QuizQuestion
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse, WorkspaceDetail

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@router.get("", response_model=List[WorkspaceDetail])
def list_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workspaces = db.query(Workspace).filter(Workspace.user_id == current_user.id).order_by(Workspace.created_at.desc()).all()
    results = []
    for ws in workspaces:
        doc_count = db.query(Document).filter(Document.workspace_id == ws.id).count()
        concept_count = db.query(ConceptNode).filter(ConceptNode.workspace_id == ws.id).count()
        quiz_count = db.query(QuizQuestion).filter(QuizQuestion.workspace_id == ws.id).count()
        results.append(WorkspaceDetail(
            id=ws.id,
            title=ws.title,
            description=ws.description or "",
            user_id=ws.user_id,
            created_at=ws.created_at,
            updated_at=ws.updated_at,
            document_count=doc_count,
            concept_count=concept_count,
            quiz_count=quiz_count
        ))
    return results

@router.post("", response_model=WorkspaceDetail, status_code=status.HTTP_201_CREATED)
def create_workspace(ws_in: WorkspaceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = Workspace(
        title=ws_in.title,
        description=ws_in.description or "",
        user_id=current_user.id
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return WorkspaceDetail(
        id=ws.id,
        title=ws.title,
        description=ws.description or "",
        user_id=ws.user_id,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
        document_count=0,
        concept_count=0,
        quiz_count=0
    )

@router.get("/{workspace_id}", response_model=WorkspaceDetail)
def get_workspace(workspace: Workspace = Depends(get_workspace_for_user), db: Session = Depends(get_db)):
    doc_count = db.query(Document).filter(Document.workspace_id == workspace.id).count()
    concept_count = db.query(ConceptNode).filter(ConceptNode.workspace_id == workspace.id).count()
    quiz_count = db.query(QuizQuestion).filter(QuizQuestion.workspace_id == workspace.id).count()
    return WorkspaceDetail(
        id=workspace.id,
        title=workspace.title,
        description=workspace.description or "",
        user_id=workspace.user_id,
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
        document_count=doc_count,
        concept_count=concept_count,
        quiz_count=quiz_count
    )

@router.put("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(ws_update: WorkspaceUpdate, workspace: Workspace = Depends(get_workspace_for_user), db: Session = Depends(get_db)):
    if ws_update.title is not None:
        workspace.title = ws_update.title
    if ws_update.description is not None:
        workspace.description = ws_update.description
    db.commit()
    db.refresh(workspace)
    return workspace

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace: Workspace = Depends(get_workspace_for_user), db: Session = Depends(get_db)):
    db.delete(workspace)
    db.commit()
    return None
