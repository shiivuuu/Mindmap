import os
from typing import List, Dict, Any
import pypdf

class DocumentParser:
    @staticmethod
    def parse_file(file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """
        Extracts pages and text from a file.
        Returns a list of dicts: [{"page_number": int, "text": str, "section": str}]
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        file_type = file_type.lower().strip(".")
        pages_data = []

        if file_type == "pdf":
            try:
                reader = pypdf.PdfReader(file_path)
                for idx, page in enumerate(reader.pages):
                    raw_text = page.extract_text() or ""
                    cleaned = DocumentParser.clean_text(raw_text)
                    if cleaned:
                        pages_data.append({
                            "page_number": idx + 1,
                            "text": cleaned,
                            "section": DocumentParser.detect_section_title(cleaned)
                        })
            except Exception as e:
                raise ValueError(f"Failed to parse PDF: {str(e)}")

        elif file_type in ["txt", "md", "markdown"]:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                cleaned = DocumentParser.clean_text(content)
                # Split large text into simulated pages (approx 2000 chars per page)
                chunk_size = 2000
                if len(cleaned) <= chunk_size:
                    pages_data.append({
                        "page_number": 1,
                        "text": cleaned,
                        "section": DocumentParser.detect_section_title(cleaned)
                    })
                else:
                    parts = [cleaned[i:i+chunk_size] for i in range(0, len(cleaned), chunk_size)]
                    for idx, part in enumerate(parts):
                        pages_data.append({
                            "page_number": idx + 1,
                            "text": part,
                            "section": DocumentParser.detect_section_title(part)
                        })
            except Exception as e:
                raise ValueError(f"Failed to parse text file: {str(e)}")
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        if not pages_data:
            pages_data.append({
                "page_number": 1,
                "text": "Empty document or unreadable text content.",
                "section": "General"
            })

        return pages_data

    @staticmethod
    def clean_text(text: str) -> str:
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        # Remove common repeated page numbering lines (e.g., 'Page 1 of 5')
        filtered = []
        for line in lines:
            if line.lower().startswith("page ") and len(line) < 15:
                continue
            filtered.append(line)
        return "\n".join(filtered)

    @staticmethod
    def detect_section_title(text: str) -> str:
        lines = text.strip().split("\n")
        if lines:
            first_line = lines[0].strip()
            # If line is short and looks like a header
            if len(first_line) < 80 and not first_line.endswith("."):
                return first_line.lstrip("#").strip()
        return "Main Content"
