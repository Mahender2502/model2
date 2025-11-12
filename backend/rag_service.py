import os
import json
import re
import chromadb
from chromadb.config import Settings
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import threading
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BNS_JSON_FILE = os.path.join(os.path.dirname(__file__), "data", "Bharatiya_Nyaya_Sanhita_1_to_19.json")
CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), "chroma_data")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini 2.5 Flash model
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    GEMINI_MODEL = genai.GenerativeModel('gemini-2.5-flash')
    print("✅ Gemini 2.5 Flash API configured")
else:
    print("⚠️ WARNING: GEMINI_API_KEY not set. RAG will not work without it.")


class _PersistentVectorStore:
    """A minimal file-backed vector store using numpy + cosine similarity.

    This provides a simple persistent alternative to Chroma so the RAG
    system remains functional even when Chroma initialization fails or
    migration is pending.
    """
    def __init__(self, persist_dir):
        self.persist_dir = persist_dir
        os.makedirs(self.persist_dir, exist_ok=True)
        self.meta_path = os.path.join(self.persist_dir, "meta.json")
        self.emb_path = os.path.join(self.persist_dir, "embeddings.npy")
        self.lock = threading.Lock()

        # docs: list of {id, document, metadata}
        self.docs = []
        self.embeddings = None

        # load existing data if present
        if os.path.exists(self.meta_path):
            try:
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    self.docs = json.load(f)
            except Exception:
                self.docs = []

        if os.path.exists(self.emb_path):
            try:
                self.embeddings = np.load(self.emb_path)
            except Exception:
                self.embeddings = None

    def _save(self):
        with self.lock:
            with open(self.meta_path, "w", encoding="utf-8") as f:
                json.dump(self.docs, f, ensure_ascii=False)
            if self.embeddings is not None:
                np.save(self.emb_path, self.embeddings)

    def add(self, ids, documents, metadatas, embeddings):
        with self.lock:
            arr = np.array(embeddings)
            # normalize shape
            if arr.ndim == 1:
                arr = arr.reshape(1, -1)

            for i, _id in enumerate(ids):
                doc = documents[i]
                meta = metadatas[i] if i < len(metadatas) else {}
                self.docs.append({"id": _id, "document": doc, "metadata": meta})

            if self.embeddings is None:
                self.embeddings = arr
            else:
                try:
                    self.embeddings = np.vstack([self.embeddings, arr])
                except Exception:
                    # fallback: recreate by concatenation
                    self.embeddings = np.concatenate([self.embeddings, arr], axis=0)

            self._save()

    def count(self):
        return len(self.docs)

    def query(self, query_embeddings, n_results=3):
        if self.embeddings is None or self.embeddings.shape[0] == 0:
            return {"documents": [[]], "metadatas": [[]], "ids": [[]], "distances": [[]]}

        q = np.array(query_embeddings)
        if q.ndim == 1:
            q = q.reshape(1, -1)

        # compute cosine similarity and return top-k
        sims = cosine_similarity(q, self.embeddings)[0]
        topk_idx = np.argsort(-sims)[:n_results]

        docs = [self.docs[i]["document"] for i in topk_idx]
        metas = [self.docs[i].get("metadata", {}) for i in topk_idx]
        ids = [self.docs[i]["id"] for i in topk_idx]
        dists = [float(1.0 - float(sims[i])) for i in topk_idx]

        return {"documents": [docs], "metadatas": [metas], "ids": [ids], "distances": [dists]}



class RAGService:
    """
    RAGService builds retrieval prompts and performs semantic retrieval.
    It no longer calls Gemini directly. Instead it returns the prompt
    text to the caller (Flask app) which can then send it to the
    configured model (e.g. LAWGPT-3.5) to avoid circular imports.
    """
    def __init__(self):
        print("🚀 Initializing RAG Service...")
        self.laws = self._load_json()
        print(f"📚 Loaded {len(self.laws)} law sections")
        
        print("🔄 Loading embedding model...")
        self.embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("✅ Embedding model loaded")

        # Initialize Chroma with persistent storage
        print(f"📁 Checking Chroma directory at: {CHROMA_PERSIST_DIR}")
        try:
            os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
            print("🔌 Initializing persistent Chroma client...")
            
            # Use PersistentClient with explicit settings for permanent storage
            self.client = chromadb.PersistentClient(
                path=CHROMA_PERSIST_DIR,
                settings=chromadb.Settings(
                    is_persistent=True,
                    anonymized_telemetry=False
                )
            )
            print(f"✅ Chroma client initialized with persist dir: {CHROMA_PERSIST_DIR}")
        except Exception as e:
            print(f"❌ Failed to initialize Chroma client: {str(e)}")
            import traceback
            traceback.print_exc()
            self.client = None

        self.collection = None
        # A simple fallback persistent vector store (file-backed) in case Chroma is unavailable
        self._fallback_store = None
        if not self.client:
            try:
                # initialize a lightweight persistent vector store using numpy + cosine-sim
                self._fallback_store = _PersistentVectorStore(CHROMA_PERSIST_DIR)
                self.collection = self._fallback_store
                print(f"ℹ️ Using fallback persistent vector store at {CHROMA_PERSIST_DIR}")
            except Exception as e:
                print(f"❌ Failed to initialize fallback vector store: {e}")

        if self.client:
            try:
                # Try to get existing collection, otherwise create it
                try:
                    self.collection = self.client.get_collection("bns_collection")
                    print("ℹ️ Found existing Chroma collection 'bns_collection'")
                except Exception:
                    self.collection = self.client.create_collection("bns_collection")
                    print("ℹ️ Created new Chroma collection 'bns_collection'")

                # If collection appears empty, (re)index
                count = None
                try:
                    if hasattr(self.collection, 'count'):
                        count = self.collection.count()
                except Exception:
                    count = None

                if not count:
                    self._setup_collection()
                else:
                    print(f"ℹ️ Chroma collection already has {count} items; skipping re-index")
            except Exception as e:
                print(f"❌ Error preparing Chroma collection: {e}")
                self.collection = None

    def _load_json(self):
        try:
            with open(BNS_JSON_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: {BNS_JSON_FILE} not found")
            return []

    def _setup_collection(self):
        """Initialize and return the ChromaDB collection with law sections"""
        print("🔧 Setting up collection...")
        
        if not self.client:
            print("❌ No Chroma client available")
            return None
            
        # Try to get existing collection first
        print("🔍 Looking for existing collection...")
        try:
            collection = self.client.get_collection("bns_collection")
            count = collection.count()
            print(f"✅ Found existing collection with {count} documents")
            self.collection = collection
            return collection
        except Exception as e:
            print(f"ℹ️ No existing collection found: {str(e)}")
            
        # Create new collection and index documents
        print("📝 Creating new collection...")
        try:
            collection = self.client.create_collection(
                name="bns_collection",
                metadata={"description": "Bharatiya Nyaya Sanhita sections"}
            )
            
            # Index all law sections
            print("📚 Indexing law sections...")
            batch_size = 50
            for i in range(0, len(self.laws), batch_size):
                batch = self.laws[i:i + batch_size]
                
                # Prepare batch data
                docs = []
                ids = []
                metadatas = []
                
                for law in batch:
                    doc_text = f"Chapter {law['chapter']}, Section {law['section']} - {law['section_title']}: {law['section_desc']}"
                    doc_id = f"Chapter-{law['chapter']}-Section-{law['section']}"
                    
                    docs.append(doc_text)
                    ids.append(doc_id)
                    metadatas.append({
                        "chapter": law["chapter"],
                        "section": law["section"],
                        "title": law["section_title"]
                    })
                
                # Create embeddings for the batch
                embeddings = self.embed_model.encode(docs).tolist()
                
                # Add to collection
                collection.add(
                    documents=docs,
                    ids=ids,
                    metadatas=metadatas,
                    embeddings=embeddings
                )
                
                print(f"✅ Indexed {i + len(batch)}/{len(self.laws)} sections")
            
            print("🎉 Collection setup complete!")
            self.collection = collection
            return collection
            
        except Exception as e:
            print(f"❌ Error setting up collection: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

            # Build and insert documents into fallback store
            count = 0
            for law in self.laws:
                try:
                    doc_text = f"Chapter {law['chapter']}, Section {law['section']} - {law['section_title']}: {law['section_desc']}"
                    embedding = self.embed_model.encode([doc_text]).tolist()
                    store.add(
                        ids=[f"Chapter-{law['chapter']}-Section-{law['section']}"],
                        documents=[doc_text],
                        metadatas=[{
                            "chapter": law["chapter"],
                            "section": law["section"],
                            "title": law["section_title"]
                        }],
                        embeddings=embedding
                    )
                    count += 1
                except Exception as e:
                    print(f"⚠️ Failed to add document Chapter {law.get('chapter')} Section {law.get('section')}: {e}")

            print(f"✅ Indexed {count} documents into fallback vector store at '{CHROMA_PERSIST_DIR}'")
            self.collection = store
            return store

        if not self.client:
            print("⚠️ Cannot setup collection because Chroma client is not available and no fallback is configured")
            return None

        try:
            collection = None
            try:
                collection = self.client.get_collection("bns_collection")
            except Exception:
                collection = self.client.create_collection("bns_collection")

            # Build and insert documents
            count = 0
            for law in self.laws:
                try:
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
                    count += 1
                except Exception as e:
                    print(f"⚠️ Failed to add document Chapter {law.get('chapter')} Section {law.get('section')}: {e}")

            # Persist the client database to disk
            try:
                if hasattr(self.client, 'persist'):
                    self.client.persist()
                else:
                    print("ℹ️ Chroma client has no persist() method; ensure persistence is configured")
            except Exception as e:
                print(f"⚠️ Could not persist Chroma DB: {e}")

            print(f"✅ Indexed {count} documents into Chroma collection 'bns_collection'")
            # ensure self.collection points to the used collection
            self.collection = collection
            return collection
        except Exception as e:
            print(f"❌ Error while setting up collection and indexing documents: {e}")
            return None

    def get_section(self, chapter_num, section_num):
        for law in self.laws:
            if law["chapter"] == chapter_num and law["section"] == section_num:
                return f"Chapter {law['chapter']}, Section {law['section']} - {law['section_title']}: {law['section_desc']}"
        return None

    def retrieve_sections(self, query, top_k=3):
        if not self.collection:
            print("⚠️ retrieve_sections called but Chroma collection is not initialized")
            return {"documents": [[]], "metadatas": [[]], "ids": [[]], "distances": [[]]}

        try:
            query_embedding = self.embed_model.encode([query]).tolist()
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=top_k
            )
            return results
        except Exception as e:
            print(f"❌ Error during Chroma query: {e}")
            return {"documents": [[]], "metadatas": [[]], "ids": [[]], "distances": [[]]}

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

    def answer_with_gemini(self, user_query, top_k=3):
        """
        Use Gemini API directly to answer a query about BNS laws.
        This performs semantic retrieval and sends the context + query to Gemini.
        Returns: The Gemini response text
        """
        if not GEMINI_API_KEY:
            print("❌ GEMINI_API_KEY not configured")
            return "Error: Gemini API key not configured. Please set GEMINI_API_KEY in environment variables."
        
        try:
            # First, retrieve relevant sections
            res = self.retrieve_sections(user_query, top_k=top_k)
            
            # Extract documents from results
            docs = []
            if isinstance(res, dict) and "documents" in res:
                try:
                    docs = res["documents"][0]
                except Exception:
                    docs = []
            
            context = "\n\n".join(docs) if docs else "No relevant sections found."
            
            # Build prompt for Gemini
            prompt = f"""You are Gemini, a legal expert on Bharatiya Nyaya Sanhita (BNS), the criminal law code of India.

Relevant BNS Sections:
{context}

User Query: {user_query}

Please provide a clear, accurate, and comprehensive answer based on the provided law sections. Cite the specific sections (Chapter and Section numbers) in your response."""

            print(f"🔄 Sending query to Gemini API...")
            
            # Send to Gemini
            response = GEMINI_MODEL.generate_content(prompt)
            
            answer = response.text
            print(f"✅ Gemini response received ({len(answer)} characters)")
            
            return answer
            
        except Exception as e:
            print(f"❌ Error calling Gemini API: {e}")
            import traceback
            traceback.print_exc()
            return f"Error: Failed to get response from Gemini API: {str(e)}"

    def answer_with_gemini_direct(self, chapter_num, section_num, user_query=None):
        """
        Look up a specific section and use Gemini to explain it.
        Returns: The Gemini response text
        """
        if not GEMINI_API_KEY:
            return "Error: Gemini API key not configured."
        
        section_text = self.get_section(chapter_num, section_num)
        if not section_text:
            return f"Section not found: Chapter {chapter_num}, Section {section_num}"
        
        try:
            prompt = f"""You are Gemini, a legal expert on Bharatiya Nyaya Sanhita (BNS).

Law Section:
{section_text}

User Query: {user_query if user_query else "Explain this section in detail, including its implications and related provisions."}

Please provide a detailed, clear, and accurate explanation. Cite the section number and chapter in your response."""

            print(f"🔄 Sending to Gemini API...")
            response = GEMINI_MODEL.generate_content(prompt)
            answer = response.text
            print(f"✅ Gemini response received ({len(answer)} characters)")
            
            return answer
            
        except Exception as e:
            print(f"❌ Error calling Gemini API: {e}")
            return f"Error: {str(e)}"


# Initialize RAG service as a singleton
rag_service = RAGService()