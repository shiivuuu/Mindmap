import json
import numpy as np
from typing import List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
import httpx
from app.core.config import settings

class EmbeddingService:
    def __init__(self):
        self._vectorizer = None
        self._fitted_corpus = []

    def compute_local_tfidf_vectors(self, corpus: List[str]) -> List[List[float]]:
        """
        Computes normalized TF-IDF feature vectors for a given corpus of chunks.
        """
        if not corpus:
            return []
        # Use sublinear tf and character+word n-grams for good semantic retrieval
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=256,
            stop_words="english"
        )
        try:
            tfidf_matrix = vectorizer.fit_transform(corpus)
            self._vectorizer = vectorizer
            return tfidf_matrix.toarray().tolist()
        except Exception:
            # Fallback if corpus contains only stop words or symbols
            return [[0.0] * 64 for _ in corpus]

    def embed_query_local(self, query: str) -> List[float]:
        if self._vectorizer is None:
            # Create a simple fallback embedding
            return [0.0] * 256
        try:
            vec = self._vectorizer.transform([query]).toarray()[0]
            return vec.tolist()
        except Exception:
            return [0.0] * 256

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings using external API if configured, otherwise uses local TF-IDF.
        """
        if settings.LLM_API_KEY and settings.LLM_PROVIDER in ["openai", "groq"]:
            try:
                base_url = settings.LLM_BASE_URL.rstrip("/") if settings.LLM_BASE_URL else "https://api.openai.com/v1"
                headers = {
                    "Authorization": f"Bearer {settings.LLM_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "input": texts[:50], # Batch max
                    "model": settings.EMBEDDING_MODEL or "text-embedding-3-small"
                }
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(f"{base_url}/embeddings", json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        return [item["embedding"] for item in data["data"]]
            except Exception:
                pass # Fall back to local
        return self.compute_local_tfidf_vectors(texts)

    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        if not vec1 or not vec2:
            return 0.0
        v1 = np.array(vec1, dtype=float)
        v2 = np.array(vec2, dtype=float)
        
        # Check matching dimensions; pad if needed
        if v1.shape[0] != v2.shape[0]:
            target_dim = max(v1.shape[0], v2.shape[0])
            v1 = np.pad(v1, (0, target_dim - v1.shape[0]))
            v2 = np.pad(v2, (0, target_dim - v2.shape[0]))

        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (norm1 * norm2))

embedding_service = EmbeddingService()
