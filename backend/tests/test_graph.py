from app.services.knowledge_graph.resolver import ConceptResolver

def test_concept_resolver_canonical_and_aliases():
    canon, aliases = ConceptResolver.get_canonical_name("BFS")
    assert canon == "Breadth-First Search"
    assert "bfs" in aliases

    canon_dfs, _ = ConceptResolver.get_canonical_name("depth-first search")
    assert canon_dfs == "Depth-First Search"

    is_equiv = ConceptResolver.are_concepts_equivalent("BFS", "Breadth First Search")
    assert is_equiv is True

def test_get_knowledge_graph(client):
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "demo@mindmesh.ai", "password": "mindmesh123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    ws_resp = client.get("/api/workspaces", headers=headers)
    ws_id = ws_resp.json()[0]["id"]

    graph_resp = client.get(f"/api/workspaces/{ws_id}/graph", headers=headers)
    assert graph_resp.status_code == 200
    graph_data = graph_resp.json()
    assert "nodes" in graph_data
    assert "edges" in graph_data
    assert graph_data["total_nodes"] >= 4
    assert graph_data["total_edges"] >= 3

    # Check that edges contain evidence provenance
    first_edge = graph_data["edges"][0]
    assert "relation_type" in first_edge
    assert "confidence" in first_edge
    assert first_edge["is_verified"] is True
