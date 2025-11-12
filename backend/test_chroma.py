import chromadb
import os

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_data")
print(f"\nTesting ChromaDB initialization at: {CHROMA_DIR}")

# Ensure directory exists
os.makedirs(CHROMA_DIR, exist_ok=True)

# Initialize client with basic settings
client = chromadb.PersistentClient(path=CHROMA_DIR)

# Create a test collection
collection = client.create_collection(name="test_collection")

# Add a test document
collection.add(
    documents=["This is a test document"],
    metadatas=[{"source": "test"}],
    ids=["test1"]
)

# Query to verify
results = collection.query(
    query_texts=["test"],
    n_results=1
)

print("\nResults:", results)
print("\nTest completed successfully!")