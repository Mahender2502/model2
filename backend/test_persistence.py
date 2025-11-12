from rag_service import rag_service
import time

def test_persistence():
    print("\n=== Testing ChromaDB Persistence ===")
    
    # First run - should create and index
    print("\n🔍 First run - checking collection...")
    collection = rag_service.collection
    if collection:
        count = collection.count()
        print(f"✅ Collection has {count} documents")
        
        # Test a query
        results = rag_service.retrieve_sections("What is rape?", top_k=1)
        print("\n📖 Sample query result:")
        if results and results.get("documents"):
            print(results["documents"][0][0][:200] + "...")
    else:
        print("❌ Failed to get collection")
        return
    
    # Wait a moment
    print("\n⏳ Waiting 2 seconds...")
    time.sleep(2)
    
    # Reload RAG service to test persistence
    print("\n🔄 Reloading RAG service to test persistence...")
    from importlib import reload
    import rag_service as rs
    reload(rs)
    
    # Second run - should load existing data
    print("\n🔍 Second run - checking collection...")
    new_collection = rs.rag_service.collection
    if new_collection:
        new_count = new_collection.count()
        print(f"✅ Reloaded collection has {new_count} documents")
        
        # Test the same query
        results = rs.rag_service.retrieve_sections("What is rape?", top_k=1)
        print("\n📖 Sample query result after reload:")
        if results and results.get("documents"):
            print(results["documents"][0][0][:200] + "...")
    else:
        print("❌ Failed to get collection after reload")

if __name__ == "__main__":
    test_persistence()