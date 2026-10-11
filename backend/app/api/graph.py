import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_for_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.graph import ConceptNode, ConceptEdge
from app.models.mastery import ConceptMastery
from app.schemas.graph import (
    ConceptNodeCreate,
    ConceptNodeUpdate,
    ConceptNodeResponse,
    ConceptEdgeCreate,
    ConceptEdgeResponse,
    GraphDataResponse
)
from app.services.knowledge_graph.resolver import ConceptResolver

router = APIRouter(tags=["Knowledge Graph"])

def format_node_response(node: ConceptNode, mastery_map: dict) -> ConceptNodeResponse:
    aliases = []
    if node.aliases_json:
        try:
            aliases = json.loads(node.aliases_json)
        except Exception:
            aliases = []
            
    m_info = mastery_map.get(node.id, {"mastery_score": 0.0, "status": "unstarted"})

    return ConceptNodeResponse(
        id=node.id,
        workspace_id=node.workspace_id,
        name=node.name,
        normalized_name=node.normalized_name,
        summary=node.summary or "",
        category=node.category or "General",
        aliases=aliases,
        difficulty_level=node.difficulty_level or "intermediate",
        source_document_id=node.source_document_id,
        source_chunk_id=node.source_chunk_id,
        created_at=node.created_at,
        mastery_score=m_info.get("mastery_score", 0.0),
        mastery_status=m_info.get("status", "unstarted")
    )

@router.get("/workspaces/{workspace_id}/graph", response_model=GraphDataResponse)
def get_knowledge_graph(
    workspace: Workspace = Depends(get_workspace_for_user),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    nodes = db.query(ConceptNode).filter(ConceptNode.workspace_id == workspace.id).all()
    edges = db.query(ConceptEdge).filter(ConceptEdge.workspace_id == workspace.id).all()

    # Fetch user mastery records
    mastery_records = (
        db.query(ConceptMastery)
        .filter(ConceptMastery.user_id == current_user.id)
        .all()
    )
    mastery_map = {m.concept_id: {"mastery_score": m.mastery_score, "status": m.status} for m in mastery_records}

    formatted_nodes = [format_node_response(n, mastery_map) for n in nodes]
    formatted_edges = [
        ConceptEdgeResponse(
            id=e.id,
            workspace_id=e.workspace_id,
            source_id=e.source_id,
            target_id=e.target_id,
            relation_type=e.relation_type,
            confidence=e.confidence,
            rationale=e.rationale or "",
            evidence_chunk_id=e.evidence_chunk_id,
            evidence_quote=e.evidence_quote,
            is_verified=e.is_verified,
            created_at=e.created_at
        ) for e in edges
    ]

    categories = sorted(list(set(n.category for n in formatted_nodes if n.category)))

    return GraphDataResponse(
        nodes=formatted_nodes,
        edges=formatted_edges,
        categories=categories,
        total_nodes=len(formatted_nodes),
        total_edges=len(formatted_edges)
    )

@router.post("/workspaces/{workspace_id}/graph/nodes", response_model=ConceptNodeResponse, status_code=status.HTTP_201_CREATED)
def create_concept_node(
    node_in: ConceptNodeCreate,
    workspace: Workspace = Depends(get_workspace_for_user),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    canon_name, aliases = ConceptResolver.get_canonical_name(node_in.name)
    norm = ConceptResolver.normalize_name(canon_name)
    
    existing = db.query(ConceptNode).filter(
        ConceptNode.workspace_id == workspace.id,
        ConceptNode.normalized_name == norm
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Concept with this canonical name already exists in workspace")

    node = ConceptNode(
        workspace_id=workspace.id,
        name=canon_name,
        normalized_name=norm,
        summary=node_in.summary or "",
        category=node_in.category or "General",
        aliases_json=json.dumps(list(set(aliases + (node_in.aliases or [])))),
        difficulty_level=node_in.difficulty_level or "intermediate"
    )
    db.add(node)
    db.commit()
    db.refresh(node)

    # Seed mastery record
    mastery = ConceptMastery(
        user_id=current_user.id,
        concept_id=node.id,
        mastery_score=0.0,
        status="unstarted"
    )
    db.add(mastery)
    db.commit()

    return format_node_response(node, {node.id: {"mastery_score": 0.0, "status": "unstarted"}})

@router.put("/graph/nodes/{node_id}", response_model=ConceptNodeResponse)
def update_concept_node(
    node_id: str,
    node_update: ConceptNodeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    node = db.query(ConceptNode).filter(ConceptNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Concept node not found")
    ws = db.query(Workspace).filter(Workspace.id == node.workspace_id).first()
    if ws.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    if node_update.name:
        node.name = node_update.name
        node.normalized_name = ConceptResolver.normalize_name(node_update.name)
    if node_update.summary is not None:
        node.summary = node_update.summary
    if node_update.category is not None:
        node.category = node_update.category
    if node_update.aliases is not None:
        node.aliases_json = json.dumps(node_update.aliases)
    if node_update.difficulty_level is not None:
        node.difficulty_level = node_update.difficulty_level

    db.commit()
    db.refresh(node)

    m = db.query(ConceptMastery).filter(ConceptMastery.user_id == current_user.id, ConceptMastery.concept_id == node.id).first()
    m_info = {node.id: {"mastery_score": m.mastery_score if m else 0.0, "status": m.status if m else "unstarted"}}
    return format_node_response(node, m_info)

@router.post("/workspaces/{workspace_id}/graph/edges", response_model=ConceptEdgeResponse, status_code=status.HTTP_201_CREATED)
def create_concept_edge(
    edge_in: ConceptEdgeCreate,
    workspace: Workspace = Depends(get_workspace_for_user),
    db: Session = Depends(get_db)
):
    # Verify nodes exist
    src = db.query(ConceptNode).filter(ConceptNode.id == edge_in.source_id, ConceptNode.workspace_id == workspace.id).first()
    tgt = db.query(ConceptNode).filter(ConceptNode.id == edge_in.target_id, ConceptNode.workspace_id == workspace.id).first()
    if not src or not tgt:
        raise HTTPException(status_code=400, detail="Source or target concept node does not exist in workspace")

    edge = ConceptEdge(
        workspace_id=workspace.id,
        source_id=edge_in.source_id,
        target_id=edge_in.target_id,
        relation_type=edge_in.relation_type or "relates_to",
        confidence=edge_in.confidence or 0.85,
        rationale=edge_in.rationale or "",
        evidence_chunk_id=edge_in.evidence_chunk_id,
        evidence_quote=edge_in.evidence_quote,
        is_verified=True
    )
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return ConceptEdgeResponse(
        id=edge.id,
        workspace_id=edge.workspace_id,
        source_id=edge.source_id,
        target_id=edge.target_id,
        relation_type=edge.relation_type,
        confidence=edge.confidence,
        rationale=edge.rationale or "",
        evidence_chunk_id=edge.evidence_chunk_id,
        evidence_quote=edge.evidence_quote,
        is_verified=edge.is_verified,
        created_at=edge.created_at
    )
