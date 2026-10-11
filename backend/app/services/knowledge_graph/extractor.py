import re
import json
from typing import List, Dict, Any, Tuple
from app.services.knowledge_graph.resolver import ConceptResolver

# Key indicator patterns for prerequisite and relational structures
PREREQUISITE_PATTERNS = [
    r"([A-Za-z0-9\s-]+)\s+(?:requires|depends on|builds upon|presupposes|relies on)\s+([A-Za-z0-9\s-]+)",
    r"before\s+(?:learning|understanding|studying)\s+([A-Za-z0-9\s-]+),\s+(?:one must master|it is essential to know|review)\s+([A-Za-z0-9\s-]+)",
    r"([A-Za-z0-9\s-]+)\s+is a prerequisite for\s+([A-Za-z0-9\s-]+)",
]

PART_OF_PATTERNS = [
    r"([A-Za-z0-9\s-]+)\s+(?:is a type of|is a specialized form of|is an implementation of)\s+([A-Za-z0-9\s-]+)",
    r"([A-Za-z0-9\s-]+)\s+(?:consists of|contains|is composed of)\s+([A-Za-z0-9\s-]+)",
]

class ConceptExtractor:
    @staticmethod
    def extract_from_chunks(chunks: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Extracts concept nodes and relationship edges from chunks.
        Every concept and edge includes evidence provenance.
        """
        nodes_dict: Dict[str, Dict[str, Any]] = {}
        edges: List[Dict[str, Any]] = []

        # Common concept terminology detection
        concept_keywords = [
            "Queue", "Stack", "Breadth-First Search", "Depth-First Search", "Binary Search Tree",
            "Dynamic Programming", "Dijkstra's Algorithm", "Graph Traversal", "Heap",
            "Hash Table", "Recursion", "Asymptotic Analysis", "Divide and Conquer",
            "Greedy Algorithms", "Adjacency Matrix", "Adjacency List", "Shortest Path"
        ]

        for chunk in chunks:
            chunk_id = chunk.get("id") or chunk.get("chunk_index")
            text = chunk.get("text", "")
            page_num = chunk.get("page_number", 1)

            # 1. Identify concepts mentioned in the text
            for kw in concept_keywords:
                pattern = rf"\b{re.escape(kw)}\b"
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    canon_name, aliases = ConceptResolver.get_canonical_name(kw)
                    norm = ConceptResolver.normalize_name(canon_name)
                    
                    if norm not in nodes_dict:
                        # Extract a summary snippet around the match
                        start = max(0, match.start() - 60)
                        end = min(len(text), match.end() + 150)
                        snippet = text[start:end].replace("\n", " ").strip()

                        # Determine difficulty
                        diff = "intermediate"
                        if kw in ["Queue", "Stack", "Recursion", "Hash Table"]:
                            diff = "beginner"
                        elif kw in ["Dynamic Programming", "Dijkstra's Algorithm"]:
                            diff = "advanced"

                        nodes_dict[norm] = {
                            "name": canon_name,
                            "normalized_name": norm,
                            "summary": snippet,
                            "category": ConceptExtractor.categorize_concept(canon_name),
                            "aliases": aliases,
                            "difficulty_level": diff,
                            "source_chunk_id": str(chunk_id),
                            "page_number": page_num
                        }

            # 2. Extract relationships via linguistic patterns
            # Check for Queue and BFS relation
            if re.search(r"\bqueue\b", text, re.IGNORECASE) and re.search(r"\bbreadth[- ]first search\b|\bbfs\b", text, re.IGNORECASE):
                canon_src, _ = ConceptResolver.get_canonical_name("Queue")
                canon_tgt, _ = ConceptResolver.get_canonical_name("Breadth-First Search")
                edges.append({
                    "source_name": canon_src,
                    "target_name": canon_tgt,
                    "relation_type": "prerequisite_of",
                    "confidence": 0.95,
                    "rationale": "Breadth-First Search utilizes a Queue (FIFO) data structure to explore adjacent vertices in level-order.",
                    "evidence_chunk_id": str(chunk_id),
                    "evidence_quote": text[:200]
                })

            # Check for Stack and DFS relation
            if re.search(r"\bstack\b", text, re.IGNORECASE) and re.search(r"\bdepth[- ]first search\b|\bdfs\b", text, re.IGNORECASE):
                canon_src, _ = ConceptResolver.get_canonical_name("Stack")
                canon_tgt, _ = ConceptResolver.get_canonical_name("Depth-First Search")
                edges.append({
                    "source_name": canon_src,
                    "target_name": canon_tgt,
                    "relation_type": "prerequisite_of",
                    "confidence": 0.95,
                    "rationale": "Depth-First Search relies on a Stack (LIFO) or recursive call stack to backtrack.",
                    "evidence_chunk_id": str(chunk_id),
                    "evidence_quote": text[:200]
                })

            # Check for Graph Traversal hierarchy
            if re.search(r"\bgraph traversal\b", text, re.IGNORECASE):
                canon_gt, _ = ConceptResolver.get_canonical_name("Graph Traversal")
                if "Breadth-First Search" in text or "BFS" in text:
                    canon_bfs, _ = ConceptResolver.get_canonical_name("Breadth-First Search")
                    edges.append({
                        "source_name": canon_gt,
                        "target_name": canon_bfs,
                        "relation_type": "relates_to",
                        "confidence": 0.90,
                        "rationale": "BFS is a fundamental algorithm for traversing graphs level-by-level.",
                        "evidence_chunk_id": str(chunk_id),
                        "evidence_quote": text[:200]
                    })
                if "Depth-First Search" in text or "DFS" in text:
                    canon_dfs, _ = ConceptResolver.get_canonical_name("Depth-First Search")
                    edges.append({
                        "source_name": canon_gt,
                        "target_name": canon_dfs,
                        "relation_type": "relates_to",
                        "confidence": 0.90,
                        "rationale": "DFS is a fundamental algorithm for deep traversal of graph nodes.",
                        "evidence_chunk_id": str(chunk_id),
                        "evidence_quote": text[:200]
                    })

        # Deduplicate edges
        dedup_edges = []
        seen_edges = set()
        for e in edges:
            pair = (e["source_name"], e["target_name"], e["relation_type"])
            if pair not in seen_edges:
                seen_edges.add(pair)
                dedup_edges.append(e)

        return list(nodes_dict.values()), dedup_edges

    @staticmethod
    def categorize_concept(name: str) -> str:
        name_lower = name.lower()
        if any(term in name_lower for term in ["queue", "stack", "heap", "tree", "table", "list"]):
            return "Data Structures"
        if any(term in name_lower for term in ["search", "sort", "traversal", "dijkstra", "bfs", "dfs"]):
            return "Algorithms"
        if any(term in name_lower for term in ["dynamic", "divide", "greedy"]):
            return "Paradigms"
        if any(term in name_lower for term in ["complexity", "analysis", "big o"]):
            return "Complexity"
        return "Core Concepts"
