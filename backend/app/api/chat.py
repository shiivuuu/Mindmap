import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_for_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionDetail,
    ChatMessageCreate,
    ChatMessageResponse,
    CitationItem
)
from app.services.retrieval.rag import RagPipeline

router = APIRouter(tags=["AI Research Chat"])

def format_message_response(msg: ChatMessage) -> ChatMessageResponse:
    citations = []
    if msg.citations_json:
        try:
            raw_citations = json.loads(msg.citations_json)
            for c in raw_citations:
                citations.append(CitationItem(
                    document_id=c.get("document_id", ""),
                    document_title=c.get("document_title", ""),
                    page_number=c.get("page_number", 1),
                    chunk_id=str(c.get("chunk_id", "")),
                    quote=c.get("quote", ""),
                    relevance_score=c.get("relevance_score", 0.8)
                ))
        except Exception:
            citations = []

    return ChatMessageResponse(
        id=msg.id,
        session_id=msg.session_id,
        sender=msg.sender,
        content=msg.content,
        citations=citations,
        insufficient_evidence=msg.insufficient_evidence,
        latency_ms=msg.latency_ms,
        created_at=msg.created_at
    )

@router.get("/workspaces/{workspace_id}/chat/sessions", response_model=List[ChatSessionResponse])
def list_chat_sessions(
    workspace: Workspace = Depends(get_workspace_for_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.workspace_id == workspace.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    result = []
    for s in sessions:
        last_msg = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).order_by(ChatMessage.created_at.desc()).first()
        msg_count = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).count()
        result.append(ChatSessionResponse(
            id=s.id,
            workspace_id=s.workspace_id,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
            last_message_preview=last_msg.content[:80] + "..." if last_msg else None,
            message_count=msg_count
        ))
    return result

@router.post("/workspaces/{workspace_id}/chat/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_chat_session(
    session_in: ChatSessionCreate,
    workspace: Workspace = Depends(get_workspace_for_user),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = ChatSession(
        user_id=current_user.id,
        workspace_id=workspace.id,
        title=session_in.title or "New Research Session"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return ChatSessionResponse(
        id=session.id,
        workspace_id=session.workspace_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        last_message_preview=None,
        message_count=0
    )

@router.get("/chat/sessions/{session_id}", response_model=ChatSessionDetail)
def get_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    ws = db.query(Workspace).filter(Workspace.id == session.workspace_id).first()
    if ws.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this session")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    formatted_msgs = [format_message_response(m) for m in messages]
    last_msg = messages[-1] if messages else None

    return ChatSessionDetail(
        id=session.id,
        workspace_id=session.workspace_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        last_message_preview=last_msg.content[:80] + "..." if last_msg else None,
        message_count=len(messages),
        messages=formatted_msgs
    )

@router.post("/chat/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def send_chat_message(
    session_id: str,
    msg_in: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    ws = db.query(Workspace).filter(Workspace.id == session.workspace_id).first()
    if ws.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # 1. Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        sender="user",
        content=msg_in.content
    )
    db.add(user_msg)
    
    # Auto-update session title if it's the default and first message
    if session.title == "New Research Session":
        session.title = msg_in.content[:40].strip() + ("..." if len(msg_in.content) > 40 else "")

    db.commit()

    # 2. Run RAG Pipeline
    answer_text, citations, insufficient, latency_ms = RagPipeline.answer_question(
        query=msg_in.content,
        workspace_id=session.workspace_id,
        db=db,
        expand_with_graph=True
    )

    # 3. Save assistant message
    asst_msg = ChatMessage(
        session_id=session.id,
        sender="assistant",
        content=answer_text,
        citations_json=json.dumps(citations),
        insufficient_evidence=insufficient,
        latency_ms=latency_ms
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    return format_message_response(asst_msg)

@router.delete("/chat/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    ws = db.query(Workspace).filter(Workspace.id == session.workspace_id).first()
    if ws.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(session)
    db.commit()
    return None
