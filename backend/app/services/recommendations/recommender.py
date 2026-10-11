from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# Documented heuristic weights (Section 8.3)
W1_KNOWLEDGE_GAP = 0.35
W2_GOAL_RELEVANCE = 0.20
W3_PREREQ_IMPORTANCE = 0.25
W4_REVIEW_URGENCY = 0.15
W5_ESTIMATED_EFFORT = 0.05

class LearningRecommender:
    @staticmethod
    def compute_recommendations(
        concepts: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        mastery_map: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Computes prerequisite-aware recommendations and organizes learning milestones.
        priority = w1*gap + w2*relevance + w3*prereq_importance + w4*review_urgency - w5*effort
        """
        now = datetime.now(timezone.utc)
        concept_lookup = {c["id"]: c for c in concepts}
        name_to_id = {c["name"].lower(): c["id"] for c in concepts}

        # Build incoming prerequisites for each concept
        prereq_map: Dict[str, List[str]] = {c["id"]: [] for c in concepts}
        dependent_count: Dict[str, int] = {c["id"]: 0 for c in concepts}

        for e in edges:
            if e.get("relation_type") == "prerequisite_of":
                src = e.get("source_id") or name_to_id.get(e.get("source_name", "").lower())
                tgt = e.get("target_id") or name_to_id.get(e.get("target_name", "").lower())
                if src and tgt and src in concept_lookup and tgt in concept_lookup:
                    prereq_map[tgt].append(src)
                    dependent_count[src] = dependent_count.get(src, 0) + 1

        recommendations = []

        for c in concepts:
            cid = c["id"]
            mastery_info = mastery_map.get(cid, {
                "mastery_score": 0.0,
                "status": "unstarted",
                "next_review_at": None,
                "total_attempts": 0
            })
            score = mastery_info["mastery_score"]
            status = mastery_info["status"]

            # 1. Knowledge gap (1 - mastery)
            knowledge_gap = 1.0 - score

            # 2. Goal relevance: Core foundational concepts have high relevance (0.8 - 1.0)
            relevance = 0.9 if c.get("category") in ["Core Concepts", "Data Structures"] else 0.75

            # 3. Prerequisite importance: How many downstream concepts rely on this?
            num_deps = dependent_count.get(cid, 0)
            prereq_importance = min(1.0, 0.4 + (num_deps * 0.2))

            # 4. Review urgency: Is spaced review overdue?
            review_urgency = 0.2
            next_rev = mastery_info.get("next_review_at")
            if next_rev:
                if isinstance(next_rev, str):
                    try:
                        next_rev = datetime.fromisoformat(next_rev.replace("Z", "+00:00"))
                    except Exception:
                        next_rev = None
                if next_rev:
                    if next_rev.tzinfo is None:
                        next_rev = next_rev.replace(tzinfo=timezone.utc)
                    if next_rev <= now:
                        review_urgency = 0.95 # Highly urgent review

            # 5. Estimated effort normalized
            diff = c.get("difficulty_level", "intermediate")
            effort = 0.3 if diff == "beginner" else (0.6 if diff == "intermediate" else 0.9)
            est_minutes = 15 if diff == "beginner" else (30 if diff == "intermediate" else 45)

            # Check prerequisites satisfied
            prereq_statuses = []
            all_prereqs_met = True
            unmet_prereq_names = []

            for p_id in prereq_map.get(cid, []):
                p_c = concept_lookup.get(p_id)
                if p_c:
                    p_score = mastery_map.get(p_id, {}).get("mastery_score", 0.0)
                    met = p_score >= 0.55
                    if not met:
                        all_prereqs_met = False
                        unmet_prereq_names.append(p_c["name"])
                    prereq_statuses.append({
                        "concept_id": p_id,
                        "concept_name": p_c["name"],
                        "mastery_score": p_score,
                        "is_satisfied": met
                    })

            # Calculate Priority Heuristic
            priority_val = (
                W1_KNOWLEDGE_GAP * knowledge_gap +
                W2_GOAL_RELEVANCE * relevance +
                W3_PREREQ_IMPORTANCE * prereq_importance +
                W4_REVIEW_URGENCY * review_urgency -
                W5_ESTIMATED_EFFORT * effort
            )

            # If prerequisites are not met, deprioritize slightly and mark locked / blocked
            if not all_prereqs_met:
                priority_val *= 0.65

            # Generate natural language explanation
            if not all_prereqs_met:
                rationale = f"Recommended to first master prerequisite '{', '.join(unmet_prereq_names)}' before advancing to {c['name']}."
                urgency_label = "Prerequisites Needed"
            elif review_urgency > 0.8:
                rationale = f"Spaced repetition review scheduled for {c['name']} to solidify long-term recall."
                urgency_label = "Review Due"
            elif status == "struggling":
                rationale = f"Identified knowledge gap in {c['name']} based on recent quiz performance ({int(score * 100)}% mastery)."
                urgency_label = "High Priority"
            elif num_deps > 0:
                rationale = f"Mastering {c['name']} unlocks {num_deps} downstream advanced topic(s) that depend on it."
                urgency_label = "Key Building Block"
            else:
                rationale = f"Next progressive step in your curriculum to strengthen {c.get('category', 'Core')} proficiency."
                urgency_label = "Up Next"

            recommendations.append({
                "concept_id": cid,
                "concept_name": c["name"],
                "category": c.get("category", "General"),
                "difficulty_level": diff,
                "mastery_score": round(score, 3),
                "mastery_status": status,
                "priority_score": round(priority_val, 3),
                "rationale": rationale,
                "prerequisites": prereq_statuses,
                "prerequisites_met": all_prereqs_met,
                "estimated_study_minutes": est_minutes,
                "urgency_label": urgency_label
            })

        # Sort recommendations by priority score descending
        recommendations.sort(key=lambda x: x["priority_score"], reverse=True)
        for idx, rec in enumerate(recommendations):
            rec["priority_rank"] = idx + 1

        # Group by category into progressive milestones
        categories = list(set(c.get("category", "General") for c in concepts))
        milestones = []
        for idx, cat in enumerate(categories):
            cat_recs = [r for r in recommendations if r["category"] == cat]
            if not cat_recs:
                continue
            cat_avg = sum(r["mastery_score"] for r in cat_recs) / len(cat_recs)
            is_comp = all(r["mastery_score"] >= 0.75 for r in cat_recs)
            milestones.append({
                "id": f"milestone-{idx+1}",
                "title": f"Milestone {idx+1}: {cat}",
                "category": cat,
                "description": f"Master fundamental concepts and relationships within {cat}.",
                "concepts": cat_recs,
                "progress_pct": round(cat_avg * 100, 1),
                "is_completed": is_comp,
                "is_current": not is_comp
            })

        # Select first eligible next recommended concept
        eligible_next = next((r for r in recommendations if r["prerequisites_met"] and r["mastery_score"] < 0.8), None)
        if not eligible_next and recommendations:
            eligible_next = recommendations[0]

        total_c = len(concepts)
        mastered_c = sum(1 for c in recommendations if c["mastery_status"] == "mastered")
        in_prog_c = sum(1 for c in recommendations if c["mastery_status"] == "learning")
        struggling_c = sum(1 for c in recommendations if c["mastery_status"] == "struggling")
        unstarted_c = sum(1 for c in recommendations if c["mastery_status"] == "unstarted")
        overall_pct = round((sum(r["mastery_score"] for r in recommendations) / total_c * 100), 1) if total_c > 0 else 0.0

        return {
            "overall_mastery_pct": overall_pct,
            "total_concepts": total_c,
            "mastered_concepts": mastered_c,
            "in_progress_concepts": in_prog_c,
            "struggling_concepts": struggling_c,
            "unstarted_concepts": unstarted_c,
            "milestones": milestones,
            "next_recommended": eligible_next,
            "priority_queue": recommendations
        }
