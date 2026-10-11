from app.services.assessment.mastery_tracker import MasteryTracker

def test_mastery_tracker_calculation():
    # Correct answer for a medium question
    res1 = MasteryTracker.calculate_updated_mastery(
        current_score=0.4,
        current_attempts=1,
        is_correct=True,
        difficulty="medium"
    )
    assert res1["mastery_score"] > 0.4
    assert res1["total_attempts"] == 2
    assert res1["next_review_at"] is not None

    # Incorrect answer drops score
    res2 = MasteryTracker.calculate_updated_mastery(
        current_score=0.7,
        current_attempts=3,
        is_correct=False,
        difficulty="medium"
    )
    assert res2["mastery_score"] < 0.7

def test_submit_quiz_attempt(client):
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "demo@mindmesh.ai", "password": "mindmesh123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    ws_resp = client.get("/api/workspaces", headers=headers)
    ws_id = ws_resp.json()[0]["id"]

    quizzes_resp = client.get(f"/api/workspaces/{ws_id}/quizzes", headers=headers)
    assert quizzes_resp.status_code == 200
    questions = quizzes_resp.json()
    assert len(questions) >= 2

    # Submit answers
    submission = {
        "answers": [
            {"question_id": questions[0]["id"], "selected_index": questions[0]["correct_index"]},
            {"question_id": questions[1]["id"], "selected_index": (questions[1]["correct_index"] + 1) % 4} # intentionally wrong
        ]
    }
    submit_resp = client.post(
        f"/api/workspaces/{ws_id}/quizzes/submit",
        json=submission,
        headers=headers
    )
    assert submit_resp.status_code == 200
    attempt_data = submit_resp.json()
    assert attempt_data["total_questions"] == 2
    assert attempt_data["correct_answers"] == 1
    assert attempt_data["score_pct"] == 50.0
    assert len(attempt_data["results"]) == 2
