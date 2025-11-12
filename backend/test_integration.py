#!/usr/bin/env python3
"""
Integration test for RAG with Gemini API
Run this after setting GEMINI_API_KEY in .env
"""

import os
import sys
import json
from dotenv import load_dotenv

# Load environment
load_dotenv()

def print_section(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def check_requirements():
    """Check if all required packages are installed"""
    print_section("1. Checking Requirements")
    
    required = [
        'google.generativeai',
        'chromadb',
        'sentence_transformers',
        'numpy',
        'sklearn'
    ]
    
    all_installed = True
    for package in required:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - NOT INSTALLED")
            all_installed = False
    
    return all_installed

def check_api_key():
    """Check if GEMINI_API_KEY is set"""
    print_section("2. Checking API Configuration")
    
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found in .env")
        print("\nTo fix:")
        print("1. Go to https://makersuite.google.com/app/apikey")
        print("2. Create an API key")
        print("3. Add to .env: GEMINI_API_KEY=your-key-here")
        return False
    
    if api_key == "your-gemini-api-key-here":
        print("⚠️  GEMINI_API_KEY is still the default placeholder")
        print("\nTo fix:")
        print("1. Go to https://makersuite.google.com/app/apikey")
        print("2. Create an API key")
        print("3. Replace placeholder in .env with actual key")
        return False
    
    # Show key length and first/last chars (for verification)
    masked = api_key[:4] + "*" * (len(api_key) - 8) + api_key[-4:]
    print(f"✅ GEMINI_API_KEY configured: {masked}")
    return True

def check_data_file():
    """Check if BNS data file exists"""
    print_section("3. Checking Data Files")
    
    data_file = "data/Bharatiya_Nyaya_Sanhita_1_to_19.json"
    
    if not os.path.exists(data_file):
        print(f"❌ Data file not found: {data_file}")
        return False
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ Data file found: {data_file}")
        print(f"   Loaded {len(data)} law sections")
        return True
    except Exception as e:
        print(f"❌ Error reading data file: {e}")
        return False

def test_rag_service():
    """Test RAG service initialization and basic functionality"""
    print_section("4. Testing RAG Service")
    
    try:
        print("Initializing RAG service...")
        from rag_service import rag_service, GEMINI_MODEL
        
        print("✅ RAG service initialized")
        print(f"   Gemini Model: {GEMINI_MODEL}")
        
        # Check collection
        if rag_service.collection:
            print("✅ ChromaDB collection ready")
        else:
            print("⚠️  ChromaDB collection not available (using fallback)")
        
        # Check if laws loaded
        print(f"✅ Loaded {len(rag_service.laws)} BNS sections")
        
        return True
    except Exception as e:
        print(f"❌ Error initializing RAG service: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_gemini_api():
    """Test Gemini API connectivity"""
    print_section("5. Testing Gemini API")
    
    try:
        import google.generativeai as genai
        from rag_service import GEMINI_MODEL
        
        print("Testing API connectivity with simple prompt...")
        
        test_response = GEMINI_MODEL.generate_content("Say 'API Connected' and nothing else")
        
        if test_response and test_response.text:
            print(f"✅ Gemini API responsive")
            print(f"   Response: {test_response.text[:50]}...")
            return True
        else:
            print("❌ No response from Gemini API")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Gemini API: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_semantic_retrieval():
    """Test semantic retrieval from BNS"""
    print_section("6. Testing Semantic Retrieval")
    
    try:
        from rag_service import rag_service
        
        test_query = "What is the punishment for murder?"
        print(f"Test query: '{test_query}'")
        
        results = rag_service.retrieve_sections(test_query, top_k=3)
        
        docs = results.get("documents", [[]])[0] if results.get("documents") else []
        metas = results.get("metadatas", [[]])[0] if results.get("metadatas") else []
        
        if docs:
            print(f"✅ Retrieved {len(docs)} relevant sections:")
            for i, (doc, meta) in enumerate(zip(docs, metas), 1):
                print(f"\n   {i}. Chapter {meta.get('chapter')}, Section {meta.get('section')}")
                print(f"      {meta.get('title')}")
            return True
        else:
            print("❌ No sections retrieved")
            return False
            
    except Exception as e:
        print(f"❌ Error testing retrieval: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_gemini_rag():
    """Test full RAG pipeline with Gemini"""
    print_section("7. Testing Full RAG Pipeline")
    
    try:
        from rag_service import rag_service
        
        test_query = "What is rape according to BNS?"
        print(f"Test query: '{test_query}'\n")
        
        print("Retrieving sections and sending to Gemini...")
        response = rag_service.answer_with_gemini(test_query, top_k=3)
        
        if response and not response.startswith("Error"):
            print(f"✅ RAG Pipeline successful")
            print(f"\nGemini Response (first 500 chars):")
            print("-" * 70)
            print(response[:500])
            if len(response) > 500:
                print("...")
            print("-" * 70)
            return True
        else:
            print(f"❌ RAG Pipeline failed: {response}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing RAG pipeline: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("  LAWNOTE RAG with Gemini - Integration Test Suite")
    print("=" * 70)
    
    tests = [
        ("Requirements Check", check_requirements),
        ("API Configuration", check_api_key),
        ("Data Files", check_data_file),
        ("RAG Service", test_rag_service),
        ("Gemini API", test_gemini_api),
        ("Semantic Retrieval", test_semantic_retrieval),
        ("Full RAG Pipeline", test_gemini_rag),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except KeyboardInterrupt:
            print("\n\n⚠️  Tests interrupted by user")
            break
        except Exception as e:
            print(f"\n❌ Unexpected error in {test_name}: {e}")
            results.append((test_name, False))
    
    # Summary
    print_section("Test Summary")
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! RAG with Gemini is ready to use.")
        print("\nYou can now:")
        print("1. Start Flask server: python app.py")
        print("2. Use /api/rag endpoint for semantic queries")
        print("3. Use /api/rag/section for specific section lookups")
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
