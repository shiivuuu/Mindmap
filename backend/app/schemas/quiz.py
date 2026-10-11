from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class QuizQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    workspace_id: str
    concept_id: str
    concept_name: Optional[str] = None
    prompt: str
    options: List[str]
    correct_index: Optional[int] = None # Can be omitted during quiz taking if hidden
    rationale: Optional[str] = None
    difficulty: str
    source_chunk_id: Optional[str] = None
    created_at: datetime

class QuizAnswerSubmission(BaseModel):
    question_id: str
    selected_index: int

class QuizSubmitRequest(BaseModel):
    answers: List[QuizAnswerSubmission]

class QuizAnswerResult(BaseModel):
    question_id: str
    concept_id: str
    concept_name: str
    selected_index: int
    correct_index: int
    is_correct: bool
    rationale: str
    difficulty: str

class QuizAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    workspace_id: str
    total_questions: int
    correct_answers: int
    score_pct: float
    results: List[QuizAnswerResult]
    completed_at: datetime

class QuizGenerateRequest(BaseModel):
    concept_id: Optional[str] = None
    count: Optional[int] = 5
    difficulty: Optional[str] = "all" # easy, medium, hard, all
