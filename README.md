# MindMesh AI — Intelligent Knowledge Graph & Personalized Learning System

![MindMesh AI](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![React Flow](https://img.shields.io/badge/React_Flow-xyflow-FF0072?style=for-the-badge)

MindMesh AI is an intelligent knowledge graph and personalized learning platform that transforms scattered educational material (lecture slides, notes, PDFs, and textbook chapters) into an interconnected, searchable, evidence-backed knowledge network.

Built in strict compliance with the **MindMesh AI Full Implementation Plan**.

---

## 🌟 Core Differentiators

1. **Evidence-Backed Concept Relationships**: Every concept node and relationship edge in the knowledge graph is linked to verified page and chunk evidence.
2. **Prerequisite-Aware Knowledge Gap Detection**: Prioritizes revision of fundamental building blocks (e.g., FIFO Queues) when downstream topics (e.g., Breadth-First Search) depend on them.
3. **Adaptive Cognitive Sequencing**: Employs the Section 8.3 priority heuristic to calculate next steps with human-readable rationales:
   $$\text{priority} = w_1 \times \text{gap} + w_2 \times \text{relevance} + w_3 \times \text{prereq\_importance} + w_4 \times \text{review\_urgency} - w_5 \times \text{effort}$$
4. **Source-Grounded AI Research**: Zero hallucinated citations. When evidence is insufficient, the system explicitly returns an insufficient-evidence alert.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database / ORM**: SQLAlchemy 2.0 with portable SQLite (zero-config local setup) and PostgreSQL + pgvector support
- **Authentication**: JWT tokens (HMAC-SHA256) with direct bcrypt password hashing
- **Document Processing**: `pypdf`, heading-aware text chunking, and metadata extraction
- **Vector Retrieval**: Sublinear TF-IDF + Cosine similarity engine with optional OpenAI/Groq embedding & chat completions endpoint
- **Testing**: Pytest with automated end-to-end integration workflows

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS (dark-first luxury SaaS interface with electric violet & cyan accents)
- **Interactive Graphs**: `@xyflow/react` (React Flow) with custom concept nodes and minimap
- **Analytics & Visualizations**: Recharts (BarCharts, AreaCharts)
- **AI Formatting**: `react-markdown` with syntax support
- **Icons**: Lucide React

---

## 🚀 Quick Start & Local Execution

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run backend server (auto-seeds starter DSA dataset on first launch)
python run.py
```
The FastAPI backend will start at `http://localhost:8000`.  
Swagger OpenAPI interactive documentation: `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
# Navigate to frontend (in a separate terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The React frontend will be accessible at `http://localhost:5173`.

---

## 🔑 Demo Credentials (Instant 1-Click Access Available)

For instant testing, 1-click login buttons are embedded directly on the login page:

| Role | Email | Password | Pre-seeded Workspace |
| :--- | :--- | :--- | :--- |
| **Student** | `demo@mindmesh.ai` | `mindmesh123` | Data Structures & Algorithms |
| **Administrator** | `admin@mindmesh.ai` | `admin123` | Full System Administration Console |

---

## 🧪 Testing and Verification

### Run Automated Backend Unit & Integration Tests
```bash
cd backend
python -m pytest tests/ -v
```
**Results**: 14 tests passing covering authentication, document parsing, RAG pipeline, graph resolution, quiz scoring, and the Section 14.1 end-to-end user workflow.

### Run Cognitive Evaluation Benchmark
```bash
python evaluation/scripts/run_evaluation.py
```
Outputs baseline comparative evaluations saved to `evaluation/results/eval_report.json`.

---

## 📁 Repository Structure
```
Mindmap/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (auth, docs, chat, graph, quizzes, etc.)
│   │   ├── core/            # Config, database, security, dependencies
│   │   ├── models/          # SQLAlchemy entity models
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # RAG, Chunker, Extractor, Recommender, Mastery
│   │   ├── main.py          # FastAPI application
│   │   └── seed_data.py     # Pre-populated starter dataset
│   ├── tests/               # 14 Comprehensive pytest suites
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── api/             # API client services
│   │   ├── components/      # Shell, Custom Nodes, Drawers, Modals
│   │   ├── context/         # Auth, Theme, Workspace state
│   │   ├── pages/           # Landing, Dashboard, Documents, Chat, Graph, etc.
│   │   └── App.jsx          # Protected React Router configuration
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── evaluation/
│   ├── datasets/            # Sample CS curriculum texts
│   ├── scripts/             # Baseline benchmark scripts
│   └── results/             # eval_report.json
├── docs/
│   ├── architecture/        # System design document
│   └── api/                 # OpenAPI endpoints reference
├── .env.example
├── .gitignore
└── README.md
```

---

## 📋 Implemented Features vs Roadmap

| Feature | Status | Notes |
| :--- | :---: | :--- |
| User Authentication & Role Management | ✅ Completed | JWT-based auth with student and admin roles |
| Multi-Workspace Support | ✅ Completed | Course/subject isolation |
| Document Ingestion & Chunking | ✅ Completed | Heading-aware chunker with page provenance |
| Source-Grounded RAG Engine | ✅ Completed | Clickable citations, insufficient-evidence fallback |
| Interactive React Flow Knowledge Graph | ✅ Completed | Custom concept nodes, minimap, radial layout |
| Concept Alias & Normalization Engine | ✅ Completed | Maps synonyms (e.g. BFS ↔ Breadth-First Search) |
| Rolling Bayesian Mastery Tracking | ✅ Completed | Updates based on attempts, difficulty, and recency |
| Prerequisite-Aware Recommendations | ✅ Completed | Section 8.3 formula with plain-language explanations |
| Spaced Repetition Scheduling | ✅ Completed | Leitner/Ebbinghaus-inspired intervals |
| Visual Analytics Dashboard | ✅ Completed | Recharts for mastery by domain and score trends |
| Administrative Console | ✅ Completed | User management, audits, vector re-indexing |
| Dark-First Premium UI/UX | ✅ Completed | Luxury deep navy/charcoal with electric violet accents |

---

## 📄 License
MIT License. Built for final-year engineering project demonstration and research evaluation.
