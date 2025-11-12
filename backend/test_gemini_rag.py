#!/usr/bin/env python3
"""Test script for RAG with Gemini"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 60)
print("Testing RAG with Gemini Integration")
print("=" * 60)

# Check if GEMINI_API_KEY is set
gemini_key = os.getenv("GEMINI_API_KEY")
if not gemini_key:
    print("❌ ERROR: GEMINI_API_KEY not set in environment variables")
    print("\nTo fix this:")
    print("1. Get your Gemini API key from: https://makersuite.google.com/app/apikey")
    print("2. Add it to your .env file:")
    print("   GEMINI_API_KEY=your-api-key-here")
    exit(1)

print("✅ GEMINI_API_KEY found")

# Initialize RAG service
print("\n🔄 Initializing RAG service with Gemini...")
try:
    from rag_service import rag_service, GEMINI_MODEL
    print("✅ RAG service initialized")
except Exception as e:
    print(f"❌ Failed to initialize RAG service: {e}")
    exit(1)

# Test 1: Query with semantic retrieval
print("\n" + "=" * 60)
print("Test 1: Semantic Query with Gemini")
print("=" * 60)
test_query = "What is the definition of rape according to BNS?"
print(f"Query: {test_query}\n")

try:
    response = rag_service.answer_with_gemini(test_query, top_k=3)
    print(f"Response:\n{response}\n")
    print("✅ Test 1 passed")
except Exception as e:
    print(f"❌ Test 1 failed: {e}")

# Test 2: Direct section query
print("\n" + "=" * 60)
print("Test 2: Direct Section Query with Gemini")
print("=" * 60)
print("Query: Chapter 5, Section 63 - What does this section cover?\n")

try:
    response = rag_service.answer_with_gemini_direct(5, 63, "What are the key elements of this definition?")
    print(f"Response:\n{response}\n")
    print("✅ Test 2 passed")
except Exception as e:
    print(f"❌ Test 2 failed: {e}")

# Test 3: Multiple retrieval test
print("\n" + "=" * 60)
print("Test 3: Retrieve Relevant Sections")
print("=" * 60)
test_query = "What are the punishments for murder?"
print(f"Query: {test_query}\n")

try:
    res = rag_service.retrieve_sections(test_query, top_k=3)
    docs = res.get("documents", [[]])[0] if res.get("documents") else []
    metas = res.get("metadatas", [[]])[0] if res.get("metadatas") else []
    
    print(f"Found {len(docs)} relevant sections:\n")
    for i, (doc, meta) in enumerate(zip(docs, metas), 1):
        print(f"{i}. Chapter {meta.get('chapter')}, Section {meta.get('section')} - {meta.get('title')}")
        print(f"   {doc[:100]}...\n")
    
    print("✅ Test 3 passed")
except Exception as e:
    print(f"❌ Test 3 failed: {e}")

print("=" * 60)
print("All tests completed!")
print("=" * 60)
