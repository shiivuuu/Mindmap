from typing import List, Dict, Any

class DocumentChunker:
    @staticmethod
    def chunk_document(pages_data: List[Dict[str, Any]], target_chunk_size: int = 500, overlap: int = 80) -> List[Dict[str, Any]]:
        """
        Splits pages into overlapping chunks, preserving page and section metadata.
        """
        chunks = []
        global_index = 0

        for page in pages_data:
            page_num = page["page_number"]
            section = page.get("section", "General")
            text = page["text"]

            # If page text is within target size, keep it as a single chunk
            if len(text) <= target_chunk_size:
                chunks.append({
                    "chunk_index": global_index,
                    "page_number": page_num,
                    "section_title": section,
                    "text": text.strip()
                })
                global_index += 1
                continue

            # Otherwise split into sentences or paragraphs with overlap
            words = text.split()
            current_words = []
            current_len = 0

            for word in words:
                current_words.append(word)
                current_len += len(word) + 1

                if current_len >= target_chunk_size:
                    chunk_text = " ".join(current_words)
                    chunks.append({
                        "chunk_index": global_index,
                        "page_number": page_num,
                        "section_title": section,
                        "text": chunk_text.strip()
                    })
                    global_index += 1

                    # Retain overlap words
                    overlap_words = []
                    overlap_len = 0
                    for w in reversed(current_words):
                        overlap_words.insert(0, w)
                        overlap_len += len(w) + 1
                        if overlap_len >= overlap:
                            break
                    current_words = overlap_words
                    current_len = sum(len(w) + 1 for w in current_words)

            if current_words and " ".join(current_words).strip():
                chunk_text = " ".join(current_words).strip()
                if not chunks or chunks[-1]["text"] != chunk_text:
                    chunks.append({
                        "chunk_index": global_index,
                        "page_number": page_num,
                        "section_title": section,
                        "text": chunk_text
                    })
                    global_index += 1

        return chunks
