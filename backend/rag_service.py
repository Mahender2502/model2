import os
import json
import re
import chromadb
from sentence_transformers import SentenceTransformer

# Configuration
BNS_JSON_FILE = os.path.join(os.path.dirname(__file__), "data", "Bharatiya_Nyaya_Sanhita_1_to_19.json")

class RAGService:
    """
    RAGService builds retrieval prompts and performs semantic retrieval.
    It no longer calls Gemini directly. Instead it returns the prompt
    text to the caller (Flask app) which can then send it to the
    configured model (e.g. LAWGPT-3.5) to avoid circular imports.
    """
    def __init__(self):
        self.laws = self._load_json()
        self.embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.client = chromadb.Client()
        self.collection = self._setup_collection()

    def _load_json(self):
        try:
            with open(BNS_JSON_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: {BNS_JSON_FILE} not found")
            return []

    def _setup_collection(self):
        collection = self.client.create_collection("bns_collection")
        
        # Build and insert documents
        for law in self.laws:
            doc_text = f"Chapter {law['chapter']}, Section {law['section']} - {law['section_title']}: {law['section_desc']}"
            embedding = self.embed_model.encode([doc_text]).tolist()
            
            collection.add(
                ids=[f"Chapter-{law['chapter']}-Section-{law['section']}"],
                documents=[doc_text],
                metadatas=[{
                    "chapter": law["chapter"],
                    "section": law["section"],
                    "title": law["section_title"]
                }],
                embeddings=embedding
            )
        
        return collection

    def get_section(self, chapter_num, section_num):
        for law in self.laws:
            if law["chapter"] == chapter_num and law["section"] == section_num:
                return f"Chapter {law['chapter']}, Section {law['section']} - {law['section_title']}: {law['section_desc']}"
        return None

    def retrieve_sections(self, query, top_k=3):
        query_embedding = self.embed_model.encode([query]).tolist()
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=top_k
        )
        return results

    def answer_by_chapter_section(self, chapter_num, section_num, query=None):
        section_text = self.get_section(chapter_num, section_num)
        if not section_text:
            return None

        prompt = f"""
You are LawGPT, a legal assistant for Bharatiya Nyaya Sanhita (BNS).
Here is the law section:

{section_text}

Query:
{query if query else "Explain this section in detail."}

Answer clearly, factually, and reference the correct section.
"""
        # Return prompt text; caller should send it to the configured LLM
        return prompt

    def answer_query_with_prompt(self, query, top_k=3):
        """
        Perform semantic retrieval and return a prompt string that contains
        the retrieved contexts plus the user query. The caller will send
        this prompt to the LAWGPT-3.5 model.
        """
        res = self.retrieve_sections(query, top_k=top_k)

        # Chroma query returns lists; guard access
        docs = []
        if isinstance(res, dict) and "documents" in res:
            # documents is a list-of-lists (per query), flatten first result
            try:
                docs = res["documents"][0]
            except Exception:
                docs = []

        context = "\n".join(docs)

        prompt = f"""
You are LawGPT, a legal assistant for Bharatiya Nyaya Sanhita (BNS).
Use the following law sections to answer the query accurately and cite section numbers:

Laws:
{context}

Query:
{query}

Answer clearly, factually, and reference the correct sections.
"""
        return prompt

    def process_query(self, user_query, top_k=3):
        """
        Build and return a prompt based on the user query.
        Returns:
          - prompt (str) if a prompt could be built
          - None if a direct lookup failed
        """
        match = re.search(r'chapter\s*(\d+).*section\s*(\d+)', user_query, re.IGNORECASE)
        if match:
            chapter, section = int(match.group(1)), int(match.group(2))
            return self.answer_by_chapter_section(chapter, section, user_query)
        else:
            return self.answer_query_with_prompt(user_query, top_k=top_k)

# Initialize RAG service as a singleton
rag_service = RAGService()