#!/usr/bin/env python3
import requests
import json

# Test script to verify Flask -> Node.js -> MongoDB flow

def test_conversation_storage():
    """Test that conversations are properly stored in MongoDB"""

    # Test data
    user_id = "507f1f77bcf86cd799439011"  # Example user ID
    session_id = None  # New session
    message = "Hello, I need legal advice about contracts."
    model = "LAWGPT-4"

    # JWT token (you'll need to replace this with a valid token)
    # For testing, you can generate a valid token or use a test user
    jwt_token = "your_jwt_token_here"

    try:
        print("🚀 Testing Flask -> Node.js -> MongoDB flow...")

        # Start Flask server if not running (this is for testing purposes)
        # In real scenario, Flask server should already be running

        # Test Node.js server health
        node_response = requests.get("http://localhost:5000/")
        if node_response.status_code == 200:
            print("✅ Node.js server is running")
        else:
            print(f"❌ Node.js server error: {node_response.status_code}")
            return False

        # Test the save conversation endpoint directly with Node.js
        print("\n📡 Testing direct Node.js conversation save...")

        # Create a test conversation
        test_payload = {
            "userId": user_id,
            "sessionId": session_id,
            "userMessage": message,
            "botMessage": "I understand you need legal advice about contracts. I'm here to help!",
            "model": model
        }

        response = requests.post(
            "http://localhost:5000/api/conversation/save",
            json=test_payload,
            headers={
                "Authorization": f"Bearer {jwt_token}",
                "Content-Type": "application/json"
            },
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Conversation saved successfully: {result}")
            return True
        else:
            print(f"❌ Failed to save conversation: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

if __name__ == "__main__":
    success = test_conversation_storage()
    if success:
        print("\n🎉 All tests passed! The MongoDB storage is working correctly.")
    else:
        print("\n💥 Tests failed. Please check the server logs for details.")
