from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_for_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.graph import ConceptNode
from app.models.mastery import ConceptMastery
from app.models.quiz import QuizAttempt

router = APIRouter(tags=["Analytics"])

@router.get("/workspaces/{workspace_id}/analytics")
def get_workspace_analytics(
    workspace: Workspace = Depends(get_workspace_for_user),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    nodes = db.query(ConceptNode).filter(ConceptNode.workspace_id == workspace.id).all()
    node_ids = [n.id for n in nodes]
    node_lookup = {n.id: n for n in nodes}

    mastery_records = (
        db.query(ConceptMastery)
        .filter(ConceptMastery.user_id == current_user.id, ConceptMastery.concept_id.in_(node_ids))
        .all()
    )
    mastery_map = {m.concept_id: m for m in mastery_records}

    # Quiz Attempts
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.workspace_id == workspace.id, QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.asc())
        .all()
    )

    # 1. Category Breakdown
    category_data = {}
    for n in nodes:
        cat = n.category or "General"
        if cat not in category_data:
            category_data[cat] = {"total": 0, "mastery_sum": 0.0, "mastered": 0}
        category_data[cat]["total"] += 1
        m = mastery_map.get(n.id)
        if m:
            category_data[cat]["mastery_sum"] += m.mastery_score
            if m.status == "mastered":
                category_data[cat]["mastered"] += 1

    category_breakdown = [
        {
            "category": cat,
            "average_mastery": round((info["mastery_sum"] / info["total"]) * 100, 1) if info["total"] > 0 else 0,
            "total_concepts": info["total"],
            "mastered_concepts": info["mastered"]
        }
        for cat, info in category_data.items()
    ]

    # 2. Quiz Performance over time
    performance_trend = [
        {
            "attempt_id": a.id,
            "date": a.completed_at.strftime("%b %d, %H:%M"),
            "score_pct": a.score_pct,
            "total_questions": a.total_questions,
            "correct_answers": a.correct_answers
        }
        for a in attempts[-10:] # Last 10 attempts
    ]

    # 3. Knowledge Gaps (concepts struggling or low score)
    gaps = []
    now = datetime.now(timezone.utc)
    reviews_due = []

    for n in nodes:
        m = mastery_map.get(n.id)
        score = m.mastery_score if m else 0.0
        status = m.status if m else "unstarted"
        attempts_count = m.total_attempts if m else 0

        if status == "struggling" or (attempts_count > 0 and score < 0.6):
            gaps.append({
                "concept_id": n.id,
                "concept_name": n.name,
                "category": n.category,
                "mastery_score": round(score * 100, 1),
                "attempts": attempts_count
            })

        if m and m.next_review_at and m.next_review_at <= now:
            reviews_due.append({
                "concept_id": n.id,
                "concept_name": n.name,
                "due_at": m.next_review_at.isoformat()
            })

    total_c = len(nodes)
    avg_score = round(sum(m.mastery_score for m in mastery_records) / total_c * 100, 1) if total_c > 0 else 0.0

    return {
        "workspace_id": workspace.id,
        "total_concepts": total_c,
        "average_mastery_pct": avg_score,
        "total_quizzes_taken": len(attempts),
        "category_breakdown": category_breakdown,
        "performance_trend": performance_trend,
        "knowledge_gaps": sorted(gaps, key=lambda x: x["mastery_score"])[:5],
        "reviews_due_count": len(reviews_due),
        "reviews_due": reviews_due
    }
