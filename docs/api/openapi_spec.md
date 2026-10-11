# MindMesh AI — REST API Documentation

Base URL: `/api`

All endpoints except authentication require the `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication (`/api/auth`)
- `POST /api/auth/register`
  - Body: `{ email, password, full_name }`
  - Response: `{ access_token, token_type, user }`
- `POST /api/auth/login`
  - Body (form data): `username=<email>&password=<password>`
  - Response: `{ access_token, token_type, user }`
- `POST /api/auth/login-json`
  - Body: `{ email, password }`
  - Response: `{ access_token, token_type, user }`
- `GET /api/auth/me`
  - Response: `UserResponse`
- `PUT /api/auth/profile`
  - Body: `{ full_name?, password? }`
  - Response: `UserResponse`

---

## 2. Workspaces (`/api/workspaces`)
- `GET /api/workspaces`
  - Returns list of user workspaces with counts of documents, concepts, and quizzes.
- `POST /api/workspaces`
  - Body: `{ title, description? }`
- `GET /api/workspaces/{workspace_id}`
- `PUT /api/workspaces/{workspace_id}`
- `DELETE /api/workspaces/{workspace_id}`

---

## 3. Documents (`/api/workspaces/{id}/documents` & `/api/documents`)
- `GET /api/workspaces/{workspace_id}/documents`
- `POST /api/workspaces/{workspace_id}/documents/upload`
  - Multipart Form: `file` (PDF/TXT/MD), `title`
  - Returns: `DocumentResponse` with status `processing`
- `GET /api/documents/{document_id}`
  - Returns document metadata and array of extracted `chunks` with page numbers.
- `POST /api/documents/{document_id}/reprocess`
- `DELETE /api/documents/{document_id}`

---

## 4. AI Research Chat (`/api`)
- `GET /api/workspaces/{workspace_id}/chat/sessions`
- `POST /api/workspaces/{workspace_id}/chat/sessions`
  - Body: `{ title? }`
- `GET /api/chat/sessions/{session_id}`
  - Returns full session conversation history and citations.
- `POST /api/chat/sessions/{session_id}/messages`
  - Body: `{ content }`
  - Response: `ChatMessageResponse` with grounded answer, `citations` array, and `insufficient_evidence` boolean flag.
- `DELETE /api/chat/sessions/{session_id}`

---

## 5. Knowledge Graph (`/api`)
- `GET /api/workspaces/{workspace_id}/graph`
  - Returns nodes, edges, category filters, total counts, and user mastery levels.
- `POST /api/workspaces/{workspace_id}/graph/nodes`
- `PUT /api/graph/nodes/{node_id}`
- `POST /api/workspaces/{workspace_id}/graph/edges`

---

## 6. Assessments & Quizzes (`/api`)
- `GET /api/workspaces/{workspace_id}/quizzes`
- `POST /api/workspaces/{workspace_id}/quizzes/generate`
  - Body: `{ concept_id?, count? }`
- `POST /api/workspaces/{workspace_id}/quizzes/submit`
  - Body: `{ answers: [{ question_id, selected_index }] }`
  - Grades attempt, updates rolling Bayesian mastery scores, calculates spaced repetition intervals, and persists attempt.
- `GET /api/workspaces/{workspace_id}/quizzes/history`

---

## 7. Recommendations & Learning Paths (`/api`)
- `GET /api/workspaces/{workspace_id}/learning-path`
  - Computes Section 8.3 priority score for all concepts.
  - Returns `milestones`, `next_recommended` concept with explanation rationale, and ordered `priority_queue`.

---

## 8. Analytics (`/api`)
- `GET /api/workspaces/{workspace_id}/analytics`
  - Returns domain breakdown, quiz score trends over time, identified knowledge gaps, and scheduled spaced repetition reviews.

---

## 9. Administration (`/api/admin`)
- `GET /api/admin/overview`
- `GET /api/admin/users`
- `GET /api/admin/documents`
- `POST /api/admin/reindex`
- `PUT /api/admin/users/{user_id}/role`
