import json
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.models.workspace import Workspace
from app.models.document import Document
from app.models.chunk import Chunk
from app.models.graph import ConceptNode, ConceptEdge
from app.models.quiz import QuizQuestion
from app.models.mastery import ConceptMastery
from app.services.retrieval.embedding import embedding_service

def seed_demo_data(db: Session):
    # Check if demo user already exists
    demo_user = db.query(User).filter(User.email == "demo@mindmesh.ai").first()
    if demo_user:
        return

    # 1. Create Demo User and Admin User
    demo_user = User(
        email="demo@mindmesh.ai",
        hashed_password=get_password_hash("mindmesh123"),
        full_name="Alex Rivera",
        role="student"
    )
    admin_user = User(
        email="admin@mindmesh.ai",
        hashed_password=get_password_hash("admin123"),
        full_name="MindMesh Admin",
        role="admin"
    )
    db.add(demo_user)
    db.add(admin_user)
    db.commit()
    db.refresh(demo_user)
    db.refresh(admin_user)

    # 2. Create Workspace
    ws = Workspace(
        title="Data Structures & Algorithms",
        description="Comprehensive curriculum covering graph traversal, queue architectures, and algorithmic efficiency.",
        user_id=demo_user.id
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)

    # 3. Create Demo Document
    doc = Document(
        workspace_id=ws.id,
        title="Graph Algorithms & Data Structures Handbook",
        file_name="dsa_graph_algorithms.pdf",
        file_path="demo_dsa_handbook.pdf",
        file_type="pdf",
        file_size_bytes=425000,
        status="completed",
        chunk_count=4,
        page_count=3
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 4. Create Chunks with Evidence Passages
    chunks_data = [
        {
            "chunk_index": 0,
            "page_number": 1,
            "section_title": "1. Fundamental Queues",
            "text": "A Queue is a linear data structure adhering strictly to the First-In, First-Out (FIFO) principle. Elements are inserted at the rear (enqueue) and removed from the front (dequeue). In computational graph theory, the queue serves as the fundamental mechanism for level-order node exploration, guaranteeing that vertices closest to the starting source are processed before deeper layers."
        },
        {
            "chunk_index": 1,
            "page_number": 1,
            "section_title": "2. Breadth-First Search (BFS)",
            "text": "Breadth-First Search (BFS) is a systematic graph traversal algorithm that explores all neighbor nodes at the current depth level prior to moving on to nodes at subsequent depth levels. BFS requires a Queue data structure to maintain the frontier of discovered vertices. On an unweighted graph, BFS computes the single-source shortest path in terms of minimum edge count with an optimal time complexity of O(V + E)."
        },
        {
            "chunk_index": 2,
            "page_number": 2,
            "section_title": "3. Depth-First Search (DFS) & Call Stacks",
            "text": "Depth-First Search (DFS) traverses as deep as possible along each branch before backtracking. Unlike BFS which utilizes a FIFO Queue, DFS inherently relies upon a Last-In, First-Out (LIFO) Stack or recursive function call stack. DFS is particularly well-suited for topological sorting, finding strongly connected components, and cycle detection in directed graphs."
        },
        {
            "chunk_index": 3,
            "page_number": 3,
            "section_title": "4. Comparative Complexity & Spanning Trees",
            "text": "Both BFS and DFS yield spanning trees when applied to connected graphs. While BFS produces a shallow, bushy breadth-first tree that minimizes path distance, DFS yields deep, narrow paths. When evaluating space complexity, BFS retains up to O(V) vertices in the queue for dense graphs, whereas DFS space consumption is bounded by the maximum recursion depth O(H)."
        }
    ]

    texts = [c["text"] for c in chunks_data]
    embeddings = embedding_service.compute_local_tfidf_vectors(texts)

    db_chunks = []
    for idx, c in enumerate(chunks_data):
        chunk_obj = Chunk(
            document_id=doc.id,
            chunk_index=c["chunk_index"],
            page_number=c["page_number"],
            section_title=c["section_title"],
            text=c["text"],
            embedding_json=json.dumps(embeddings[idx])
        )
        db.add(chunk_obj)
        db_chunks.append(chunk_obj)
    db.commit()

    # 5. Create Concept Nodes
    concepts_info = [
        {
            "name": "Queue",
            "normalized_name": "queue",
            "summary": "A linear First-In, First-Out (FIFO) data structure supporting enqueue and dequeue operations.",
            "category": "Data Structures",
            "aliases": ["FIFO Queue", "Linear Queue"],
            "difficulty": "beginner",
            "chunk_idx": 0,
            "mastery": 0.40,
            "status": "struggling"
        },
        {
            "name": "Breadth-First Search",
            "normalized_name": "breadth-first search",
            "summary": "Graph traversal algorithm that explores neighbor vertices level by level using a FIFO Queue.",
            "category": "Algorithms",
            "aliases": ["BFS", "Level Order Traversal"],
            "difficulty": "intermediate",
            "chunk_idx": 1,
            "mastery": 0.25,
            "status": "unstarted"
        },
        {
            "name": "Depth-First Search",
            "normalized_name": "depth-first search",
            "summary": "Graph traversal algorithm exploring deep branches before backtracking using a LIFO Stack.",
            "category": "Algorithms",
            "aliases": ["DFS"],
            "difficulty": "intermediate",
            "chunk_idx": 2,
            "mastery": 0.70,
            "status": "learning"
        },
        {
            "name": "Graph Traversal",
            "normalized_name": "graph traversal",
            "summary": "The systematic methodology of visiting every vertex in a graph structure.",
            "category": "Core Concepts",
            "aliases": ["Graph Search", "Node Exploration"],
            "difficulty": "beginner",
            "chunk_idx": 1,
            "mastery": 0.85,
            "status": "mastered"
        },
        {
            "name": "Time Complexity",
            "normalized_name": "time complexity",
            "summary": "Asymptotic analysis of computational operations, specifically O(V + E) for standard graph searches.",
            "category": "Complexity",
            "aliases": ["Big O", "Asymptotic Runtime"],
            "difficulty": "intermediate",
            "chunk_idx": 1,
            "mastery": 0.60,
            "status": "learning"
        }
    ]

    db_nodes = {}
    for c in concepts_info:
        node = ConceptNode(
            workspace_id=ws.id,
            name=c["name"],
            normalized_name=c["normalized_name"],
            summary=c["summary"],
            category=c["category"],
            aliases_json=json.dumps(c["aliases"]),
            difficulty_level=c["difficulty"],
            source_document_id=doc.id,
            source_chunk_id=db_chunks[c["chunk_idx"]].id
        )
        db.add(node)
        db.flush()
        db_nodes[c["name"]] = node

        # Seed Mastery record
        mastery = ConceptMastery(
            user_id=demo_user.id,
            concept_id=node.id,
            mastery_score=c["mastery"],
            status=c["status"],
            total_attempts=2 if c["status"] != "unstarted" else 0,
            correct_attempts=1 if c["status"] == "learning" else (2 if c["status"] == "mastered" else 0)
        )
        db.add(mastery)

    db.commit()

    # 6. Create Concept Edges with Provenance
    edges_info = [
        {
            "source": "Queue",
            "target": "Breadth-First Search",
            "relation_type": "prerequisite_of",
            "confidence": 0.98,
            "rationale": "Breadth-First Search fundamentally relies on a FIFO Queue to manage the frontier of discovered vertices.",
            "chunk_idx": 1,
            "quote": "BFS requires a Queue data structure to maintain the frontier of discovered vertices."
        },
        {
            "source": "Graph Traversal",
            "target": "Breadth-First Search",
            "relation_type": "relates_to",
            "confidence": 0.95,
            "rationale": "BFS is one of the two primary canonical graph traversal strategies.",
            "chunk_idx": 1,
            "quote": "Breadth-First Search (BFS) is a systematic graph traversal algorithm..."
        },
        {
            "source": "Graph Traversal",
            "target": "Depth-First Search",
            "relation_type": "relates_to",
            "confidence": 0.95,
            "rationale": "DFS is a canonical depth-first graph traversal algorithm.",
            "chunk_idx": 2,
            "quote": "Depth-First Search (DFS) traverses as deep as possible along each branch..."
        },
        {
            "source": "Breadth-First Search",
            "target": "Time Complexity",
            "relation_type": "part_of",
            "confidence": 0.90,
            "rationale": "BFS graph traversal runs in O(V + E) time on adjacency lists.",
            "chunk_idx": 1,
            "quote": "optimal time complexity of O(V + E)."
        }
    ]

    for e in edges_info:
        edge = ConceptEdge(
            workspace_id=ws.id,
            source_id=db_nodes[e["source"]].id,
            target_id=db_nodes[e["target"]].id,
            relation_type=e["relation_type"],
            confidence=e["confidence"],
            rationale=e["rationale"],
            evidence_chunk_id=db_chunks[e["chunk_idx"]].id,
            evidence_quote=e["quote"],
            is_verified=True
        )
        db.add(edge)

    # 7. Create Seed Quiz Questions
    quizzes = [
        {
            "concept": "Breadth-First Search",
            "prompt": "Which data structure is primarily utilized by Breadth-First Search (BFS) to manage vertex exploration order?",
            "options": ["Queue (FIFO)", "Stack (LIFO)", "Priority Queue / Max-Heap", "Circular Array with LIFO order"],
            "correct_index": 0,
            "rationale": "BFS visits vertices level by level, requiring a Queue (First-In-First-Out) to keep track of discovered neighbors.",
            "difficulty": "easy",
            "chunk_idx": 1
        },
        {
            "concept": "Breadth-First Search",
            "prompt": "What is the standard time complexity of Breadth-First Search on a graph with V vertices and E edges using an adjacency list?",
            "options": ["O(V + E)", "O(V * E)", "O(V^2)", "O(log V)"],
            "correct_index": 0,
            "rationale": "Every vertex is enqueued and dequeued once (O(V)), and each edge is examined (O(E)), yielding O(V + E).",
            "difficulty": "medium",
            "chunk_idx": 1
        },
        {
            "concept": "Queue",
            "prompt": "What fundamental ordering principle defines a standard Queue data structure?",
            "options": ["FIFO (First In, First Out)", "LIFO (Last In, First Out)", "Priority-based ordering", "Random Access"],
            "correct_index": 0,
            "rationale": "A queue guarantees that the first element inserted is the first element removed (First-In, First-Out).",
            "difficulty": "easy",
            "chunk_idx": 0
        },
        {
            "concept": "Depth-First Search",
            "prompt": "What data structure or mechanism is fundamentally required to implement Depth-First Search (DFS)?",
            "options": ["Stack (LIFO) or recursive call stack", "Queue (FIFO)", "Binary Search Tree", "Hash Map"],
            "correct_index": 0,
            "rationale": "DFS dives deeply along each branch before backtracking, naturally utilizing a LIFO Stack or the execution call stack.",
            "difficulty": "easy",
            "chunk_idx": 2
        }
    ]

    for q in quizzes:
        q_obj = QuizQuestion(
            workspace_id=ws.id,
            concept_id=db_nodes[q["concept"]].id,
            prompt=q["prompt"],
            options_json=json.dumps(q["options"]),
            correct_index=q["correct_index"],
            rationale=q["rationale"],
            difficulty=q["difficulty"],
            source_chunk_id=db_chunks[q["chunk_idx"]].id
        )
        db.add(q_obj)

    db.commit()
