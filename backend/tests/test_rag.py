def test_rag_grounded_answer_and_citations(client):
    # Log in as demo user
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "demo@mindmesh.ai", "password": "mindmesh123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get demo workspace
    ws_resp = client.get("/api/workspaces", headers=headers)
    ws_id = ws_resp.json()[0]["id"]

    # Create a chat session
    session_resp = client.post(
        f"/api/workspaces/{ws_id}/chat/sessions",
        json={"title": "BFS & Queue Research Session"},
        headers=headers
    )
    assert session_resp.status_code == 201
    session_id = session_resp.json()["id"]

    # Ask grounded question: "How does BFS work and what data structure does it require?"
    msg_resp = client.post(
        f"/api/chat/sessions/{session_id}/messages",
        json={"content": "How does BFS work and what data structure does it require?"},
        headers=headers
    )
    assert msg_resp.status_code == 200
    msg_data = msg_resp.json()
    assert msg_data["sender"] == "assistant"
    assert msg_data["insufficient_evidence"] is False
    assert len(msg_data["citations"]) > 0
    first_citation = msg_data["citations"][0]
    assert "document_title" in first_citation
    assert "page_number" in first_citation
    assert "quote" in first_citation

def test_rag_insufficient_evidence(client):
    # Log in as demo user
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "demo@mindmesh.ai", "password": "mindmesh123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get demo workspace
    ws_resp = client.get("/api/workspaces", headers=headers)
    ws_id = ws_resp.json()[0]["id"]

    # Create session
    session_resp = client.post(
        f"/api/workspaces/{ws_id}/chat/sessions",
        json={"title": "Unrelated Topic Test"},
        headers=headers
    )
    session_id = session_resp.json()["id"]

    # Ask question completely outside the scope: e.g. Quantum Photosynthesis
    msg_resp = client.post(
        f"/api/chat/sessions/{session_id}/messages",
        json={"content": "What is the biological mechanism of quantum photosynthesis in cyanobacteria chlorophyll?"},
        headers=headers
    )
    assert msg_resp.status_code == 200
    msg_data = msg_resp.json()
    assert msg_data["insufficient_evidence"] is True
    assert "Insufficient Evidence" in msg_data["content"]
