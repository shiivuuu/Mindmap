def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "MindMesh" in data["service"]

def test_login_demo_user(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "demo@mindmesh.ai", "password": "mindmesh123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "demo@mindmesh.ai"

def test_login_invalid_password(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "demo@mindmesh.ai", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_register_new_user(client):
    payload = {
        "email": "sarah.chen@university.edu",
        "password": "Password123!",
        "full_name": "Sarah Chen"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "sarah.chen@university.edu"

    # Test me endpoint with new user token
    token = data["access_token"]
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["full_name"] == "Sarah Chen"
