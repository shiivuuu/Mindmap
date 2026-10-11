import json
import time
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.chunk import Chunk
from app.models.graph import ConceptNode, ConceptEdge
from app.services.retrieval.embedding import embedding_service
from app.services.llm_provider import LLMProvider

class RagPipeline:
    @staticmethod
    def answer_question(
        query: str,
        workspace_id: str,
        db: Session,
        expand_with_graph: bool = True
    ) -> Tuple[str, List[Dict[str, Any]], bool, int]:
        """
        Executes end-to-end RAG pipeline:
        1. Fetch all chunks in the workspace
        2. Vector similarity retrieval
        3. Optional graph neighbor retrieval expansion
        4. Rerank and deduplicate
        5. Grounded synthesis with citations
        Returns (answer_markdown, citations, insufficient_evidence, latency_ms)
        """
        start_time = time.time()

        # 1. Fetch chunks belonging to documents in this workspace
        chunks_with_doc = (
            db.query(Chunk, Document.title)
            .join(Document, Chunk.document_id == Document.id)
            .filter(Document.workspace_id == workspace_id, Document.status == "completed")
            .all()
        )

        if not chunks_with_doc:
            latency_ms = int((time.time() - start_time) * 1000)
            return (
                "### No Documents Available\n\n"
                "There are no completed documents uploaded to this workspace yet. "
                "Please upload lecture notes or study PDFs in the **Documents** section first.",
                [],
                True,
                latency_ms
            )

        # 2. Vector search: compute query embedding and similarities
        corpus_texts = [c.Chunk.text for c in chunks_with_doc]
        
        # Fit vectorizer if not fitted or use embeddings
        embeddings_list = []
        for c in chunks_with_doc:
            if c.Chunk.embedding_json:
                try:
                    embeddings_list.append(json.loads(c.Chunk.embedding_json))
                except Exception:
                    embeddings_list.append(None)
            else:
                embeddings_list.append(None)

        # If chunks don't have embeddings stored, compute on the fly
        if not any(embeddings_list):
            embeddings_list = embedding_service.compute_local_tfidf_vectors(corpus_texts)
            # Cache embeddings into chunks
            for idx, c in enumerate(chunks_with_doc):
                c.Chunk.embedding_json = json.dumps(embeddings_list[idx])
            try:
                db.commit()
            except Exception:
                db.rollback()

        query_vec = embedding_service.embed_query_local(query)

        scored_chunks = []
        query_words = [term for term in query.lower().split() if len(term) > 3]

        for idx, (chunk_obj, doc_title) in enumerate(chunks_with_doc):
            chunk_vec = embeddings_list[idx]
            sim = embedding_service.cosine_similarity(query_vec, chunk_vec) if chunk_vec else 0.0
            
            # Additional keyword match boost
            text_lower = chunk_obj.text.lower()
            keyword_matches = sum(1 for term in query_words if term in text_lower)
            keyword_boost = keyword_matches * 0.08
            
            total_score = min(1.0, sim + keyword_boost)
            # Only include if there is actual semantic similarity or keyword match
            if total_score > 0.15 and (sim > 0.05 or keyword_matches > 0):
                scored_chunks.append({
                    "id": chunk_obj.id,
                    "document_id": chunk_obj.document_id,
                    "document_title": doc_title,
                    "page_number": chunk_obj.page_number,
                    "text": chunk_obj.text,
                    "score": total_score
                })

        # Sort by score descending
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)

        # 3. Graph neighbor retrieval expansion (Section 7.2)
        if expand_with_graph and scored_chunks:
            top_passages_text = " ".join([p["text"] for p in scored_chunks[:3]]).lower()
            concepts = db.query(ConceptNode).filter(ConceptNode.workspace_id == workspace_id).all()
            matched_concepts = [c for c in concepts if c.name.lower() in top_passages_text]
            
            for mc in matched_concepts[:2]:
                edges = (
                    db.query(ConceptEdge)
                    .filter(
                        ConceptEdge.workspace_id == workspace_id,
                        (ConceptEdge.source_id == mc.id) | (ConceptEdge.target_id == mc.id)
                    )
                    .all()
                )
                for edge in edges:
                    if edge.evidence_chunk_id:
                        ev_chunk = db.query(Chunk).filter(Chunk.id == edge.evidence_chunk_id).first()
                        if ev_chunk and not any(sc["id"] == ev_chunk.id for sc in scored_chunks):
                            ev_doc = db.query(Document).filter(Document.id == ev_chunk.document_id).first()
                            scored_chunks.append({
                                "id": ev_chunk.id,
                                "document_id": ev_chunk.document_id,
                                "document_title": ev_doc.title if ev_doc else "Related Concept",
                                "page_number": ev_chunk.page_number,
                                "text": ev_chunk.text,
                                "score": 0.45 # Neighbor baseline
                            })

        # Check evidence sufficiency threshold
        if not scored_chunks or scored_chunks[0]["score"] < 0.20:
            latency_ms = int((time.time() - start_time) * 1000)
            return (
                "### Insufficient Evidence\n\n"
                "The documents uploaded to this workspace do not contain sufficient evidence to address your inquiry with factual certainty. "
                "Consider uploading additional lecture slides or textbook excerpts covering this topic.",
                [],
                True,
                latency_ms
            )

        # 4. Generate grounded synthesis with citations
        top_candidates = scored_chunks[:5]
        answer, citations, insufficient = LLMProvider.generate_chat_response(query, top_candidates)
        latency_ms = int((time.time() - start_time) * 1000)

        return answer, citations, insufficient, latency_ms
