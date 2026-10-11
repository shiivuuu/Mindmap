from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PrerequisiteStatus(BaseModel):
    concept_id: str
    concept_name: str
    mastery_score: float
    is_satisfied: bool

class RecommendationItem(BaseModel):
    concept_id: str
    concept_name: str
    category: str
    difficulty_level: str
    mastery_score: float
    mastery_status: str # unstarted, struggling, learning, mastered
    priority_score: float # Computed using Section 8.3 heuristic
    priority_rank: int
    rationale: str # Plain English explanation of why recommended
    prerequisites: List[PrerequisiteStatus] = []
    prerequisites_met: bool
    estimated_study_minutes: int
    urgency_label: str # High Priority, Up Next, Review Due, Locked

class LearningPathMilestone(BaseModel):
    id: str
    title: str
    category: str
    description: str
    concepts: List[RecommendationItem]
    progress_pct: float
    is_completed: bool
    is_current: bool

class LearningPathResponse(BaseModel):
    workspace_id: str
    overall_mastery_pct: float
    total_concepts: int
    mastered_concepts: int
    in_progress_concepts: int
    struggling_concepts: int
    unstarted_concepts: int
    milestones: List[LearningPathMilestone]
    next_recommended: Optional[RecommendationItem] = None
    priority_queue: List[RecommendationItem] = []
