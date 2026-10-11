from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document
from app.models.chunk import Chunk
from app.models.graph import ConceptNode, ConceptEdge
from app.models.quiz import QuizQuestion, QuizAttempt
from app.services.retrieval.embedding import embedding_service
import json

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/overview")
def get_system_overview(admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> Dict[str, Any]:
    return {
        "total_users": db.query(User).count(),
        "total_workspaces": db.query(Workspace).count(),
        "total_documents": db.query(Document).count(),
        "total_chunks": db.query(Chunk).count(),
        "total_concepts": db.query(ConceptNode).count(),
        "total_edges": db.query(ConceptEdge).count(),
        "total_quiz_questions": db.query(QuizQuestion).count(),
        "total_quiz_attempts": db.query(QuizAttempt).count(),
    }

@router.get("/users")
def get_all_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    results = []
    for u in users:
        results.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "workspaces_count": len(u.workspaces)
        })
    return results

@router.get("/documents")
def get_all_documents(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        results.append({
            "id": d.id,
            "workspace_id": d.workspace_id,
            "title": d.title,
            "file_name": d.file_name,
            "file_type": d.file_type,
            "status": d.status,
            "chunk_count": d.chunk_count,
            "page_count": d.page_count,
            "created_at": d.created_at
        })
    return results

@router.post("/reindex")
def reindex_all_embeddings(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    chunks = db.query(Chunk).all()
    if not chunks:
        return {"reindexed_count": 0, "status": "No chunks found"}

    texts = [c.text for c in chunks]
    embeddings = embedding_service.compute_local_tfidf_vectors(texts)
    for idx, c in enumerate(chunks):
        c.embedding_json = json.dumps(embeddings[idx])
    db.commit()

    return {"reindexed_count": len(chunks), "status": "Success"}

@router.put("/users/{user_id}/role")
def update_user_role(user_id: str, role: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if role not in ["student", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'student' or 'admin'")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    return {"message": f"Updated {user.email} role to {role}"}
