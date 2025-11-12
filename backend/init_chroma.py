import os
import chromadb
from chromadb.config import Settings
from rag_service import rag_service

print("\n=== RAG Service Initialization Test ===")
print(f"Chroma directory: {os.path.abspath('chroma_data')}")

# Force collection setup
print("\nInitializing collection...")
collection = rag_service._setup_collection()

# Verify collection
if collection:
    try:
        count = collection.count() if hasattr(collection, 'count') else None
        print(f"\nCollection initialized successfully!")
        print(f"Document count: {count}")
    except Exception as e:
        print(f"\nError checking collection: {e}")
else:
    print("\nFailed to initialize collection")