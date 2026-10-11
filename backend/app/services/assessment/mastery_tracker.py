import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

DIFFICULTY_WEIGHTS = {
    "easy": 0.8,
    "medium": 1.0,
    "hard": 1.3
}

class MasteryTracker:
    @staticmethod
    def calculate_updated_mastery(
        current_score: float,
        current_attempts: int,
        is_correct: bool,
        difficulty: str = "medium",
        last_attempt_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Calculates updated mastery using transparent rolling score:
        - difficulty weighting
        - recency factor
        - sample confidence
        - spaced repetition next review interval
        """
        diff_weight = DIFFICULTY_WEIGHTS.get(difficulty.lower(), 1.0)
        
        # New attempt count
        new_attempts = current_attempts + 1

        # Base learning rate shrinks gracefully as attempts grow (Bayesian damping)
        alpha = max(0.2, 1.0 / math.sqrt(new_attempts + 1))
        
        # Target score for this attempt
        target = 1.0 if is_correct else 0.0
        
        # Adjusted delta incorporating difficulty
        if is_correct:
            step = alpha * (target - current_score) * diff_weight
        else:
            step = alpha * (target - current_score) * (1.0 / diff_weight)

        new_score = max(0.0, min(1.0, current_score + step))

        # Confidence: increases with sample size (asymptotic to 1.0)
        # e.g., 1 attempt -> ~0.33, 3 attempts -> ~0.65, 5 attempts -> ~0.82
        confidence = round(1.0 - math.exp(-0.35 * new_attempts), 2)

        # Categorize status
        if new_attempts == 0:
            status = "unstarted"
        elif new_score < 0.45:
            status = "struggling"
        elif new_score < 0.80:
            status = "learning"
        else:
            status = "mastered"

        # Calculate Spaced Repetition interval
        now = datetime.now(timezone.utc)
        if not is_correct:
            interval_hours = 12 # Review soon
        else:
            # Leitner-inspired multiplier
            if new_score < 0.5:
                interval_hours = 24 # 1 day
            elif new_score < 0.75:
                interval_hours = 72 # 3 days
            else:
                interval_hours = 168 # 7 days
                
        next_review_at = now + timedelta(hours=interval_hours)

        return {
            "mastery_score": round(new_score, 3),
            "confidence": confidence,
            "total_attempts": new_attempts,
            "status": status,
            "next_review_at": next_review_at,
            "last_attempt_at": now
        }
