import os
import json
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.chunk import Chunk
from app.models.graph import ConceptNode, ConceptEdge
from app.models.quiz import QuizQuestion
from app.models.mastery import ConceptMastery
from app.services.documents.parser import DocumentParser
from app.services.documents.chunker import DocumentChunker
from app.services.retrieval.embedding import embedding_service
from app.services.knowledge_graph.extractor import ConceptExtractor
from app.services.knowledge_graph.resolver import ConceptResolver
from app.services.llm_provider import LLMProvider

class DocumentProcessor:
    @staticmethod
    def process_document(document_id: str, db: Session):
        """
        Executes document ingestion pipeline:
        1. Parse file
        2. Chunk text
        3. Compute embeddings
        4. Extract concepts and edges
        5. Generate seed quiz questions
        """
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return

        try:
            doc.status = "processing"
            db.commit()

            # 1. Parse file
            pages_data = DocumentParser.parse_file(doc.file_path, doc.file_type)
            doc.page_count = len(pages_data)

            # 2. Chunk text
            chunks_data = DocumentChunker.chunk_document(pages_data)
            doc.chunk_count = len(chunks_data)

            # 3. Compute embeddings
            texts = [c["text"] for c in chunks_data]
            embeddings = embedding_service.compute_local_tfidf_vectors(texts)

            # Save Chunks to database
            db_chunks = []
            for idx, c in enumerate(chunks_data):
                chunk_obj = Chunk(
                    document_id=doc.id,
                    chunk_index=c["chunk_index"],
                    text=c["text"],
                    page_number=c["page_number"],
                    section_title=c.get("section_title"),
                    embedding_json=json.dumps(embeddings[idx]) if idx < len(embeddings) else None
                )
                db.add(chunk_obj)
                db_chunks.append(chunk_obj)

            db.commit()

            # 4. Extract concepts & relationships
            chunks_for_extractor = [
                {
                    "id": ch.id,
                    "text": ch.text,
                    "page_number": ch.page_number,
                    "chunk_index": ch.chunk_index
                }
                for ch in db_chunks
            ]
            extracted_nodes, extracted_edges = ConceptExtractor.extract_from_chunks(chunks_for_extractor)

            # Map from concept normalized name to DB node ID
            node_map = {}

            for n in extracted_nodes:
                norm = n["normalized_name"]
                # Check if concept already exists in workspace
                existing_node = (
                    db.query(ConceptNode)
                    .filter(
                        ConceptNode.workspace_id == doc.workspace_id,
                        ConceptNode.normalized_name == norm
                    )
                    .first()
                )

                if existing_node:
                    node_map[norm] = existing_node.id
                    # Update summary if empty
                    if not existing_node.summary and n.get("summary"):
                        existing_node.summary = n["summary"]
                else:
                    new_node = ConceptNode(
                        workspace_id=doc.workspace_id,
                        name=n["name"],
                        normalized_name=norm,
                        summary=n.get("summary", ""),
                        category=n.get("category", "General"),
                        aliases_json=json.dumps(n.get("aliases", [])),
                        difficulty_level=n.get("difficulty_level", "intermediate"),
                        source_document_id=doc.id,
                        source_chunk_id=n.get("source_chunk_id")
                    )
                    db.add(new_node)
                    db.flush()
                    node_map[norm] = new_node.id

                    # Seed concept mastery record for workspace owner
                    workspace = doc.workspace
                    if workspace and workspace.user_id:
                        mastery_rec = ConceptMastery(
                            user_id=workspace.user_id,
                            concept_id=new_node.id,
                            mastery_score=0.0,
                            status="unstarted"
                        )
                        db.add(mastery_rec)

                    # 5. Generate quiz questions for this new concept
                    concept_chunks = [ch for ch in chunks_for_extractor if n["name"].lower() in ch["text"].lower()]
                    quiz_items = LLMProvider.generate_quiz_questions(new_node.name, concept_chunks or chunks_for_extractor[:1], count=2)
                    for q in quiz_items:
                        quiz_obj = QuizQuestion(
                            workspace_id=doc.workspace_id,
                            concept_id=new_node.id,
                            prompt=q["prompt"],
                            options_json=json.dumps(q["options"]),
                            correct_index=q["correct_index"],
                            rationale=q["rationale"],
                            difficulty=q["difficulty"],
                            source_chunk_id=q.get("source_chunk_id")
                        )
                        db.add(quiz_obj)

            # Save Edges
            for e in extracted_edges:
                src_norm = ConceptResolver.normalize_name(e["source_name"])
                tgt_norm = ConceptResolver.normalize_name(e["target_name"])
                src_id = node_map.get(src_norm)
                tgt_id = node_map.get(tgt_norm)

                if src_id and tgt_id and src_id != tgt_id:
                    # Check if edge already exists
                    existing_edge = (
                        db.query(ConceptEdge)
                        .filter(
                            ConceptEdge.workspace_id == doc.workspace_id,
                            ConceptEdge.source_id == src_id,
                            ConceptEdge.target_id == tgt_id,
                            ConceptEdge.relation_type == e["relation_type"]
                        )
                        .first()
                    )
                    if not existing_edge:
                        new_edge = ConceptEdge(
                            workspace_id=doc.workspace_id,
                            source_id=src_id,
                            target_id=tgt_id,
                            relation_type=e["relation_type"],
                            confidence=e.get("confidence", 0.85),
                            rationale=e.get("rationale", ""),
                            evidence_chunk_id=e.get("evidence_chunk_id"),
                            evidence_quote=e.get("evidence_quote")
                        )
                        db.add(new_edge)

            doc.status = "completed"
            db.commit()

        except Exception as e:
            db.rollback()
            doc.status = "failed"
            doc.error_message = f"Processing error: {str(e)[:400]}"
            db.commit()
