import io
from app.services.documents.parser import DocumentParser
from app.services.documents.chunker import DocumentChunker

def test_document_parser_and_chunker():
    raw_text = (
        "# Breadth-First Search Overview\n\n"
        "Breadth-First Search (BFS) is an algorithm for traversing or searching tree or graph data structures. "
        "It starts at the tree root and explores all nodes at the present depth prior to moving on to nodes at the next depth level.\n\n"
        "## Required Data Structures\n\n"
        "BFS fundamentally requires a Queue data structure to maintain the frontier of discovered vertices."
    )
    cleaned = DocumentParser.clean_text(raw_text)
    assert len(cleaned) > 50

    pages = [{"page_number": 1, "text": cleaned, "section": "Breadth-First Search Overview"}]
    chunks = DocumentChunker.chunk_document(pages, target_chunk_size=120, overlap=30)
    assert len(chunks) >= 2
    assert chunks[0]["page_number"] == 1
    assert "BFS" in chunks[0]["text"] or "Breadth-First" in chunks[0]["text"]

def test_list_and_get_documents(client):
    # Log in as demo user
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "demo@mindmesh.ai", "password": "mindmesh123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List workspaces
    ws_resp = client.get("/api/workspaces", headers=headers)
    assert ws_resp.status_code == 200
    workspaces = ws_resp.json()
    assert len(workspaces) >= 1
    ws_id = workspaces[0]["id"]

    # List documents in workspace
    docs_resp = client.get(f"/api/workspaces/{ws_id}/documents", headers=headers)
    assert docs_resp.status_code == 200
    docs = docs_resp.json()
    assert len(docs) >= 1
    doc_id = docs[0]["id"]

    # Get document details
    doc_detail_resp = client.get(f"/api/documents/{doc_id}", headers=headers)
    assert doc_detail_resp.status_code == 200
    doc_data = doc_detail_resp.json()
    assert "chunks" in doc_data
    assert len(doc_data["chunks"]) >= 1
