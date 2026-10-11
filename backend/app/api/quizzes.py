import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_for_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.quiz import QuizQuestion, QuizAttempt
from app.models.graph import ConceptNode
from app.models.mastery import ConceptMastery
from app.models.chunk import Chunk
from app.schemas.quiz import (
    QuizQuestionResponse,
    QuizSubmitRequest,
    QuizAttemptResponse,
    QuizAnswerResult,
    QuizGenerateRequest
)
from app.services.assessment.mastery_tracker import MasteryTracker
from app.services.llm_provider import LLMProvider

router = APIRouter(tags=["Quizzes & Assessments"])

def format_quiz_question(q: QuizQuestion) -> QuizQuestionResponse:
    options = []
    if q.options_json:
        try:
            options = json.loads(q.options_json)
        except Exception:
            options = []

    return QuizQuestionResponse(
        id=q.id,
        workspace_id=q.workspace_id,
        concept_id=q.concept_id,
        concept_name=q.concept.name if q.concept else "General",
        prompt=q.prompt,
        options=options,
        correct_index=q.correct_index,
        rationale=q.rationale,
        difficulty=q.difficulty,
        source_chunk_id=q.source_chunk_id,
        created_at=q.created_at
    )

@router.get("/workspaces/{workspace_id}/quizzes", response_model=List[QuizQuestionResponse])
def get_quiz_questions(
    concept_id: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    workspace: Workspace = Depends(get_workspace_for_user),
    db: Session = Depends(get_db)
):
    query = db.query(QuizQuestion).filter(QuizQuestion.workspace_id == workspace.id)
    if concept_id:
        query = query.filter(QuizQuestion.concept_id == concept_id)
    
    questions = query.limit(limit).all()
    return [format_quiz_question(q) for q in questions]

@router.post("/workspaces/{workspace_id}/quizzes/generate", response_model=List[QuizQuestionResponse])
def generate_questions(
    req: QuizGenerateRequest,
    workspace: Workspace = Depends(get_workspace_for_user),
    db: Session = Depends(get_db)
):
    # Find target concepts
    if req.concept_id:
        concepts = db.query(ConceptNode).filter(ConceptNode.id == req.concept_id, ConceptNode.workspace_id == workspace.id).all()
    else:
        concepts = db.query(ConceptNode).filter(ConceptNode.workspace_id == workspace.id).limit(3).all()

    if not concepts:
        raise HTTPException(status_code=400, detail="No concepts found in workspace to generate questions for. Upload documents first.")

    created_questions = []
    for concept in concepts:
        # Find relevant chunks
        chunks = (
            db.query(Chunk)
            .filter(Chunk.text.ilike(f"%{concept.name}%"))
            .limit(3)
            .all()
        )
        chunk_dicts = [{"id": ch.id, "text": ch.text} for ch in chunks]
        items = LLMProvider.generate_quiz_questions(concept.name, chunk_dicts, count=req.count or 2)
        
        for item in items:
            q_obj = QuizQuestion(
                workspace_id=workspace.id,
                concept_id=concept.id,
                prompt=item["prompt"],
                options_json=json.dumps(item["options"]),
                correct_index=item["correct_index"],
                rationale=item["rationale"],
                difficulty=item["difficulty"],
                source_chunk_id=str(item.get("source_chunk_id") or "")
            )
            db.add(q_obj)
            db.flush()
            created_questions.append(format_quiz_question(q_obj))

    db.commit()
    return created_questions

@router.post("/workspaces/{workspace_id}/quizzes/submit", response_model=QuizAttemptResponse)
def submit_quiz_attempt(
    attempt_in: QuizSubmitRequest,
    workspace: Workspace = Depends(get_workspace_for_user),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not attempt_in.answers:
        raise HTTPException(status_code=400, detail="No answers provided in quiz submission")

    results: List[QuizAnswerResult] = []
    correct_count = 0

    for ans in attempt_in.answers:
        q = db.query(QuizQuestion).filter(QuizQuestion.id == ans.question_id, QuizQuestion.workspace_id == workspace.id).first()
        if not q:
            continue

        is_correct = (ans.selected_index == q.correct_index)
        if is_correct:
            correct_count += 1

        results.append(QuizAnswerResult(
            question_id=q.id,
            concept_id=q.concept_id,
            concept_name=q.concept.name if q.concept else "General",
            selected_index=ans.selected_index,
            correct_index=q.correct_index,
            is_correct=is_correct,
            rationale=q.rationale or "",
            difficulty=q.difficulty
        ))

        # Update Concept Mastery in DB using MasteryTracker
        mastery = (
            db.query(ConceptMastery)
            .filter(
                ConceptMastery.user_id == current_user.id,
                ConceptMastery.concept_id == q.concept_id
            )
            .first()
        )
        if not mastery:
            mastery = ConceptMastery(
                user_id=current_user.id,
                concept_id=q.concept_id,
                mastery_score=0.0,
                status="unstarted"
            )
            db.add(mastery)
            db.flush()

        update_info = MasteryTracker.calculate_updated_mastery(
            current_score=mastery.mastery_score,
            current_attempts=mastery.total_attempts,
            is_correct=is_correct,
            difficulty=q.difficulty,
            last_attempt_at=mastery.last_attempt_at
        )

        mastery.mastery_score = update_info["mastery_score"]
        mastery.confidence = update_info["confidence"]
        mastery.total_attempts = update_info["total_attempts"]
        if is_correct:
            mastery.correct_attempts += 1
        mastery.status = update_info["status"]
        mastery.next_review_at = update_info["next_review_at"]
        mastery.last_attempt_at = update_info["last_attempt_at"]

    total = len(results)
    score_pct = round((correct_count / total * 100), 1) if total > 0 else 0.0

    # Save QuizAttempt
    attempt_record = QuizAttempt(
        user_id=current_user.id,
        workspace_id=workspace.id,
        total_questions=total,
        correct_answers=correct_count,
        score_pct=score_pct,
        answers_json=json.dumps([r.model_dump() for r in results])
    )
    db.add(attempt_record)
    db.commit()
    db.refresh(attempt_record)

    return QuizAttemptResponse(
        id=attempt_record.id,
        workspace_id=workspace.id,
        total_questions=total,
        correct_answers=correct_count,
        score_pct=score_pct,
        results=results,
        completed_at=attempt_record.completed_at
    )

@router.get("/workspaces/{workspace_id}/quizzes/history")
def get_quiz_history(
    workspace: Workspace = Depends(get_workspace_for_user),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.workspace_id == workspace.id, QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .limit(20)
        .all()
    )
    out = []
    for a in attempts:
        raw_results = []
        if a.answers_json:
            try:
                raw_results = json.loads(a.answers_json)
            except Exception:
                pass
        out.append({
            "id": a.id,
            "total_questions": a.total_questions,
            "correct_answers": a.correct_answers,
            "score_pct": a.score_pct,
            "completed_at": a.completed_at,
            "results": raw_results
        })
    return out
