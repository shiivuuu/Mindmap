# MindMesh AI — System Architecture Specification

## 1. System Overview
MindMesh AI is an intelligent knowledge graph and personalized learning platform that transforms scattered educational materials (PDFs, lecture notes, textbook chapters) into an interconnected, searchable, evidence-backed knowledge network.

### Three Core Differentiators
1. **Evidence-Backed Concept Relationships**: Every concept node and edge is traceable to page and chunk provenance.
2. **Prerequisite-Aware Knowledge Gap Detection**: Prioritizes revision of foundational building blocks when downstream topics depend on them.
3. **Adaptive Cognitive Sequencing**: Priority heuristic computes personalized next steps with human-readable rationales.

---

## 2. Component Architecture
```
                  ┌──────────────────────────────────────────────┐
                  │         React 18 + Vite Frontend             │
                  │  (Tailwind CSS, React Flow, Recharts)        │
                  └──────────────────────┬───────────────────────┘
                                         │ JSON / REST API + Bearer JWT
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            FastAPI Backend App               │
                  │  (Request Validation, Auth, Rate Limiting)   │
                  └─────────┬────────────┬─────────────┬─────────┘
                            │            │             │
        ┌───────────────────┴───┐        │       ┌─────┴──────────────────┐
        ▼                       ▼        ▼       ▼                        ▼
 ┌───────────────┐ ┌─────────────┐ ┌──────────┐ ┌───────────────┐ ┌──────────────┐
 │ Document      │ │ RAG & Vector│ │ Knowledge│ │ Mastery       │ │ Personalized │
 │ Ingestion &   │ │ Retrieval   │ │ Graph    │ │ Tracking &    │ │ Learning     │
 │ Parser        │ │ Engine      │ │ Resolver │ │ Assessments   │ │ Recommender  │
 └───────────────┘ └─────────────┘ └──────────┘ └───────────────┘ └──────────────┘
        │                       │        │             │                 │
        └───────────────────────┴────────┼─────────────┴─────────────────┘
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            SQL Database Storage              │
                  │    PostgreSQL + pgvector (or SQLite)         │
                  └──────────────────────────────────────────────┘
```

---

## 3. Core Modules & Pipelines

### 3.1 Document Ingestion Pipeline
1. **Validation**: Enforces allowed extensions (`.pdf`, `.txt`, `.md`) and size caps (< 25MB).
2. **Parsing**: Extracts text and page indices using `pypdf` with header/footer cleanup.
3. **Chunking**: Heading-aware windowing (~500 chars with ~80 char overlap) preserves page and section metadata.
4. **Vector Embedding**: Generates vector representations (local sublinear TF-IDF or OpenAI embedding endpoint).

### 3.2 Knowledge Graph Construction & Duplicate Resolution
- **Canonical Concept Normalization**: Cleans punctuation and whitespace.
- **Alias Dictionaries**: Maps common synonyms (e.g. `BFS` <-> `Breadth-First Search`, `LIFO` <-> `Stack`).
- **Edge Extraction**: Detects semantic relations (`prerequisite_of`, `relates_to`, `part_of`, etc.) and attaches passage citations.

### 3.3 Source-Grounded RAG Pipeline
- Filters chunks strictly by the user's workspace.
- Combines cosine similarity with keyword boosting and optional graph-neighbor expansion.
- Evaluates evidence sufficiency threshold (> 0.20): if below threshold, returns an explicit Insufficient Evidence notification to prevent hallucinations.
- Returns verified source citations with document title, page number, chunk ID, and quote snippet.

### 3.4 Adaptive Cognitive Personalization (Section 8.3 Heuristic)
```
priority = w1 * knowledge_gap + w2 * goal_relevance + w3 * prereq_importance + w4 * review_urgency - w5 * effort
```
- `w1 = 0.35`: Knowledge gap (`1.0 - mastery_score`).
- `w2 = 0.20`: Foundational relevance of the domain.
- `w3 = 0.25`: Number of downstream dependent concepts.
- `w4 = 0.15`: Spaced repetition interval urgency.
- `w5 = 0.05`: Estimated cognitive effort.
- Concepts with unmet prerequisites are gated with clear rationales.
