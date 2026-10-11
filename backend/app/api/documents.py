import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user, get_workspace_for_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document
from app.models.chunk import Chunk
from app.schemas.document import DocumentResponse, DocumentDetail, ChunkResponse
from app.services.documents.processor import DocumentProcessor

router = APIRouter(tags=["Documents"])

ALLOWED_EXTENSIONS = {"pdf", "txt", "md"}

def run_processing_job(document_id: str):
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        DocumentProcessor.process_document(document_id, db)
    finally:
        db.close()

@router.get("/workspaces/{workspace_id}/documents", response_model=List[DocumentResponse])
def list_workspace_documents(
    workspace: Workspace = Depends(get_workspace_for_user),
    db: Session = Depends(get_db)
):
    docs = db.query(Document).filter(Document.workspace_id == workspace.id).order_by(Document.created_at.desc()).all()
    return docs

@router.post("/workspaces/{workspace_id}/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    workspace_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(None),
    workspace: Workspace = Depends(get_workspace_for_user),
    db: Session = Depends(get_db)
):
    filename = file.filename or "uploaded_file"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type .{ext}. MindMesh AI supports PDF, TXT, and Markdown (.md)."
        )

    # Secure file storage
    safe_name = f"{uuid.uuid4().hex}_{filename}"
    target_path = os.path.join(settings.FILE_STORAGE_PATH, safe_name)

    # Stream file to storage
    file_size = 0
    with open(target_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024): # 1MB chunks
            file_size += len(chunk)
            if file_size > settings.UPLOAD_MAX_MB * 1024 * 1024:
                buffer.close()
                if os.path.exists(target_path):
                    os.remove(target_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {settings.UPLOAD_MAX_MB}MB."
                )
            buffer.write(chunk)

    doc_title = title if title and title.strip() else filename.rsplit(".", 1)[0].replace("_", " ").title()

    doc = Document(
        workspace_id=workspace.id,
        title=doc_title,
        file_name=filename,
        file_path=target_path,
        file_type=ext,
        file_size_bytes=file_size,
        status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Trigger background processor
    background_tasks.add_task(run_processing_job, doc.id)

    return doc

@router.get("/documents/{document_id}", response_model=DocumentDetail)
def get_document_details(document_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check workspace authorization
    ws = db.query(Workspace).filter(Workspace.id == doc.workspace_id).first()
    if ws.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this document")

    chunks = db.query(Chunk).filter(Chunk.document_id == doc.id).order_by(Chunk.chunk_index.asc()).all()
    chunk_responses = [
        ChunkResponse(
            id=c.id,
            document_id=c.document_id,
            chunk_index=c.chunk_index,
            text=c.text,
            page_number=c.page_number,
            section_title=c.section_title,
            created_at=c.created_at
        ) for c in chunks
    ]

    return DocumentDetail(
        id=doc.id,
        workspace_id=doc.workspace_id,
        title=doc.title,
        file_name=doc.file_name,
        file_type=doc.file_type,
        file_size_bytes=doc.file_size_bytes,
        status=doc.status,
        error_message=doc.error_message,
        chunk_count=doc.chunk_count,
        page_count=doc.page_count,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        chunks=chunk_responses
    )

@router.post("/documents/{document_id}/reprocess", response_model=DocumentResponse)
def reprocess_document(document_id: str, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    ws = db.query(Workspace).filter(Workspace.id == doc.workspace_id).first()
    if ws.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    doc.status = "processing"
    doc.error_message = None
    db.commit()

    background_tasks.add_task(run_processing_job, doc.id)
    return doc

@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    ws = db.query(Workspace).filter(Workspace.id == doc.workspace_id).first()
    if ws.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Delete local file if it exists
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return None
