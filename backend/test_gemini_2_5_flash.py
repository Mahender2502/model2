#!/usr/bin/env python3
"""
Test script to verify Gemini 2.5 Flash integration in RAG system
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 60)
print("Testing Gemini 2.5 Flash RAG Integration")
print("=" * 60)

# Test 1: Check API key
print("\n1️⃣  Checking GEMINI_API_KEY...")
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    print(f"✅ GEMINI_API_KEY is configured")
    print(f"   Key preview: {api_key[:10]}...{api_key[-5:]}")
else:
    print("❌ GEMINI_API_KEY not found in environment")
    sys.exit(1)

# Test 2: Import RAG service
print("\n2️⃣  Importing RAG Service...")
try:
    from rag_service import rag_service, GEMINI_MODEL
    print("✅ RAG Service imported successfully")
except Exception as e:
    print(f"❌ Failed to import RAG Service: {e}")
    sys.exit(1)

# Test 3: Check Gemini model
print("\n3️⃣  Checking Gemini Model Configuration...")
try:
    import google.generativeai as genai
    # The model name is stored as a property
    if hasattr(GEMINI_MODEL, 'model_name'):
        model_name = GEMINI_MODEL.model_name
    else:
        # Get it from the model's internal representation
        model_name = str(GEMINI_MODEL._model_name) if hasattr(GEMINI_MODEL, '_model_name') else "unknown"
    
    print(f"✅ Gemini Model: {model_name}")
    if 'gemini-2.5-flash' in str(GEMINI_MODEL).lower():
        print("✅ CONFIRMED: Using Gemini 2.5 Flash")
    else:
        print(f"⚠️  Model details: {GEMINI_MODEL}")
except Exception as e:
    print(f"⚠️  Could not verify model name: {e}")

# Test 4: Check ChromaDB initialization
print("\n4️⃣  Checking ChromaDB Collection...")
try:
    if rag_service.collection:
        try:
            if hasattr(rag_service.collection, 'count'):
                count = rag_service.collection.count()
                print(f"✅ ChromaDB collection initialized with {count} items")
            else:
                print(f"✅ ChromaDB collection initialized (count method not available)")
        except Exception as e:
            print(f"ℹ️  Collection exists but count check failed: {e}")
    else:
        print("⚠️  No collection found")
except Exception as e:
    print(f"⚠️  Error checking collection: {e}")

# Test 5: Test a simple RAG query
print("\n5️⃣  Testing RAG Query with Gemini 2.5 Flash...")
print("   Query: 'What is rape under BNS?'")
try:
    response = rag_service.answer_with_gemini("What is rape under BNS?", top_k=3)
    if response and not response.startswith("Error"):
        print(f"✅ RAG Response received ({len(response)} characters)")
        print(f"\n   First 200 characters of response:")
        print(f"   {response[:200]}...")
    else:
        print(f"❌ RAG Response error: {response}")
except Exception as e:
    print(f"❌ Error during RAG query: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Test Complete!")
print("=" * 60)
