import os
from app.models.document import Document
from app.services.documents.processor import DocumentProcessor

def test_complete_e2e_workflow(client, db_session):
    # 1. Register new student user
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "email": "e2e.student@test.com",
            "password": "Password123!",
            "full_name": "E2E Student"
        }
    )
    assert reg_resp.status_code == 201
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create custom workspace
    ws_resp = client.post(
        "/api/workspaces",
        json={
            "title": "Algorithms & Search Techniques",
            "description": "E2E test workspace for graph learning"
        },
        headers=headers
    )
    assert ws_resp.status_code == 201
    ws_id = ws_resp.json()["id"]

    # 3. Create real text file for ingestion
    test_filepath = os.path.join(os.path.dirname(__file__), "test_bfs.txt")
    with open(test_filepath, "w", encoding="utf-8") as f:
        f.write(
            "Breadth-First Search (BFS) is an algorithmic graph traversal technique. "
            "BFS strictly requires a Queue to maintain discovered vertices in first-in, first-out order. "
            "The time complexity is O(V + E)."
        )

    try:
        # Document record
        doc = Document(
            workspace_id=ws_id,
            title="BFS Foundations Guide",
            file_name="test_bfs.txt",
            file_path=test_filepath,
            file_type="txt",
            status="queued"
        )
        db_session.add(doc)
        db_session.commit()
        db_session.refresh(doc)

        # Process concepts from document
        DocumentProcessor.process_document(doc.id, db_session)
        assert doc.status == "completed"

        # 4. Ask source-grounded question
        chat_sess_resp = client.post(
            f"/api/workspaces/{ws_id}/chat/sessions",
            json={"title": "E2E Research Session"},
            headers=headers
        )
        sess_id = chat_sess_resp.json()["id"]

        msg_resp = client.post(
            f"/api/chat/sessions/{sess_id}/messages",
            json={"content": "What data structure does BFS require?"},
            headers=headers
        )
        assert msg_resp.status_code == 200
        msg_data = msg_resp.json()
        assert len(msg_data["citations"]) > 0

        # 5. View knowledge graph
        graph_resp = client.get(f"/api/workspaces/{ws_id}/graph", headers=headers)
        assert graph_resp.status_code == 200
        graph_data = graph_resp.json()
        assert graph_data["total_nodes"] > 0

        # 6. Take and complete quiz
        quizzes_resp = client.get(f"/api/workspaces/{ws_id}/quizzes", headers=headers)
        assert quizzes_resp.status_code == 200
        questions = quizzes_resp.json()
        assert len(questions) > 0

        quiz_submission = {
            "answers": [
                {"question_id": questions[0]["id"], "selected_index": questions[0]["correct_index"]}
            ]
        }
        submit_resp = client.post(
            f"/api/workspaces/{ws_id}/quizzes/submit",
            json=quiz_submission,
            headers=headers
        )
        assert submit_resp.status_code == 200

        # 7. Receive adaptive learning path recommendation
        lp_resp = client.get(f"/api/workspaces/{ws_id}/learning-path", headers=headers)
        assert lp_resp.status_code == 200
        lp_data = lp_resp.json()
        assert lp_data["next_recommended"] is not None
        assert len(lp_data["priority_queue"]) > 0

    finally:
        if os.path.exists(test_filepath):
            os.remove(test_filepath)
