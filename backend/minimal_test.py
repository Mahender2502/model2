import os
import chromadb
from sentence_transformers import SentenceTransformer

# Set up paths
CHROMA_DIR = os.path.abspath("chroma_data")
print(f"\n📁 Using Chroma directory: {CHROMA_DIR}")

# Ensure directory exists
os.makedirs(CHROMA_DIR, exist_ok=True)

try:
    # Initialize the embedding model
    print("\n🔄 Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("✅ Model loaded")

    # Initialize Chroma client
    print("\n🔌 Initializing Chroma client...")
    client = chromadb.PersistentClient(
        path=CHROMA_DIR,
        settings=chromadb.Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=CHROMA_DIR,
            anonymized_telemetry=False
        )
    )
    print("✅ Client initialized")

    # Create or get collection
    print("\n📚 Setting up collection...")
    try:
        collection = client.get_collection("test")
        print("✅ Found existing collection")
    except:
        collection = client.create_collection("test")
        print("✅ Created new collection")

    # Add a test document if collection is empty
    if collection.count() == 0:
        print("\n📝 Adding test document...")
        embeddings = model.encode(["This is a test document"]).tolist()
        collection.add(
            documents=["This is a test document"],
            embeddings=embeddings,
            metadatas=[{"source": "test"}],
            ids=["test1"]
        )
        print("✅ Document added")
    
    # Query the collection
    print("\n🔍 Testing query...")
    results = collection.query(
        query_embeddings=model.encode(["test"]).tolist(),
        n_results=1
    )
    
    print("\n📊 Results:")
    print(f"Documents: {results['documents']}")
    print(f"IDs: {results['ids']}")
    
    print("\n✨ Test completed successfully!")

except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()