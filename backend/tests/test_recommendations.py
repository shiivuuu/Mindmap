def test_learning_path_recommendations(client):
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "demo@mindmesh.ai", "password": "mindmesh123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    ws_resp = client.get("/api/workspaces", headers=headers)
    ws_id = ws_resp.json()[0]["id"]

    path_resp = client.get(f"/api/workspaces/{ws_id}/learning-path", headers=headers)
    assert path_resp.status_code == 200
    data = path_resp.json()
    assert "priority_queue" in data
    assert len(data["priority_queue"]) > 0
    assert "milestones" in data
    assert data["next_recommended"] is not None

    # Check that each recommendation contains rationale and priority score
    first_rec = data["priority_queue"][0]
    assert "priority_score" in first_rec
    assert "rationale" in first_rec
    assert len(first_rec["rationale"]) > 10
    assert "urgency_label" in first_rec
