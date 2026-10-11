from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_for_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.graph import ConceptNode, ConceptEdge
from app.models.mastery import ConceptMastery
from app.schemas.recommendation import LearningPathResponse
from app.services.recommendations.recommender import LearningRecommender

router = APIRouter(tags=["Personalized Learning Paths"])

@router.get("/workspaces/{workspace_id}/learning-path", response_model=LearningPathResponse)
def get_learning_path(
    workspace: Workspace = Depends(get_workspace_for_user),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    nodes = db.query(ConceptNode).filter(ConceptNode.workspace_id == workspace.id).all()
    edges = db.query(ConceptEdge).filter(ConceptEdge.workspace_id == workspace.id).all()
    mastery_records = (
        db.query(ConceptMastery)
        .filter(ConceptMastery.user_id == current_user.id)
        .all()
    )

    concepts_data = [
        {
            "id": n.id,
            "name": n.name,
            "category": n.category or "General",
            "difficulty_level": n.difficulty_level or "intermediate"
        }
        for n in nodes
    ]

    edges_data = [
        {
            "source_id": e.source_id,
            "target_id": e.target_id,
            "relation_type": e.relation_type
        }
        for e in edges
    ]

    mastery_map = {
        m.concept_id: {
            "mastery_score": m.mastery_score,
            "status": m.status,
            "next_review_at": m.next_review_at.isoformat() if m.next_review_at else None,
            "total_attempts": m.total_attempts
        }
        for m in mastery_records
    }

    result = LearningRecommender.compute_recommendations(concepts_data, edges_data, mastery_map)

    return LearningPathResponse(
        workspace_id=workspace.id,
        overall_mastery_pct=result["overall_mastery_pct"],
        total_concepts=result["total_concepts"],
        mastered_concepts=result["mastered_concepts"],
        in_progress_concepts=result["in_progress_concepts"],
        struggling_concepts=result["struggling_concepts"],
        unstarted_concepts=result["unstarted_concepts"],
        milestones=result["milestones"],
        next_recommended=result["next_recommended"],
        priority_queue=result["priority_queue"]
    )
