import re
from typing import List, Dict, Optional, Tuple

COMMON_ALIASES: Dict[str, List[str]] = {
    "breadth-first search": ["bfs", "breadth first search", "level order traversal"],
    "depth-first search": ["dfs", "depth first search"],
    "binary search tree": ["bst", "binary search trees"],
    "dynamic programming": ["dp"],
    "minimum spanning tree": ["mst", "kruskal", "prim"],
    "single source shortest path": ["dijkstra", "dijkstra's algorithm", "bellman-ford"],
    "time complexity": ["big o", "asymptotic complexity", "runtime complexity"],
    "first in first out": ["fifo", "queue"],
    "last in first out": ["lifo", "stack"],
    "hash table": ["hash map", "hashmap", "dictionary", "hash tables"],
    "linked list": ["singly linked list", "doubly linked list", "linked lists"],
    "graph traversal": ["graph search", "graph traversals"],
}

class ConceptResolver:
    @staticmethod
    def normalize_name(name: str) -> str:
        """
        Normalizes string by removing extra whitespace, punctuation, and converting to lowercase.
        """
        cleaned = re.sub(r"[^\w\s-]", "", name.strip().lower())
        return re.sub(r"\s+", " ", cleaned).strip()

    @staticmethod
    def get_canonical_name(name: str) -> Tuple[str, List[str]]:
        """
        Resolves a concept name to its canonical form and returns associated aliases.
        """
        normalized = ConceptResolver.normalize_name(name)
        
        # Check alias dictionary
        for canonical, aliases in COMMON_ALIASES.items():
            if normalized == canonical or normalized in aliases:
                # Format canonical nicely in Title Case (handling hyphens)
                display_canonical = "-".join([
                    " ".join(w.capitalize() for w in part.split())
                    for part in canonical.split("-")
                ])
                all_aliases = list(set([name.lower(), canonical] + aliases))
                return display_canonical, all_aliases
        
        # If not in dictionary, title-case the provided name
        display_name = "-".join([
            " ".join(w.capitalize() for w in part.split())
            for part in normalized.split("-")
        ])
        return display_name, [name.lower()]

    @staticmethod
    def are_concepts_equivalent(name1: str, name2: str) -> bool:
        norm1 = ConceptResolver.normalize_name(name1)
        norm2 = ConceptResolver.normalize_name(name2)
        if norm1 == norm2:
            return True
        canon1, _ = ConceptResolver.get_canonical_name(name1)
        canon2, _ = ConceptResolver.get_canonical_name(name2)
        return canon1.lower() == canon2.lower()
