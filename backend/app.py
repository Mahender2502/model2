
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer
import requests
import os
from dotenv import load_dotenv
import jwt
from functools import wraps

load_dotenv()

app = Flask(__name__)
CORS(app)

# ---------------- Config ----------------
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret_key")
NODE_SERVER_URL = os.getenv("NODE_SERVER_URL", "http://localhost:5000")

# Load tokenizer for LAWGPT-3.5
try:
    tokenizer = AutoTokenizer.from_pretrained("google/gemma-3-1b-it")
    print("✅ Tokenizer loaded successfully")
except Exception as e:
    print(f"⚠️ Warning: Tokenizer not loaded: {e}")
    tokenizer = None

# Model endpoints
MODEL_ENDPOINTS = {
    'LAWGPT-4': "https://consequential-wettable-danika.ngrok-free.dev/generate",
    'LAWGPT-3.5': "https://abhinav777-77-head.hf.space/generate_from_ids",
    'Legal-Pro': "https://consequential-wettable-danika.ngrok-free.dev/generate",
    'Contract-AI': "https://consequential-wettable-danika.ngrok-free.dev/generate",
    'LitAssist': "https://consequential-wettable-danika.ngrok-free.dev/generate"
}

# ---------------- JWT Auth ----------------
def authenticate_token(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Access token required"}), 401
        try:
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header
            decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            request.user = decoded
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 403
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 403
        return f(*args, **kwargs)
    return wrapper

# ---------------- Tokenizer ----------------
def encode_message_for_lawgpt(message):
    if not tokenizer:
        raise Exception("Tokenizer not loaded")
    messages = [
        {
            "role": "system",
            "content": """You are LawGPT. Respond in clear professional language using short bullet points when possible.
                Use emojis to improve readability:
                🧩 Concept / Idea
                ⚖ Law / Legal principle
                🔍 Research / Case references
                📄 Document / Contract
                ⚠ Risk / Warning
                🏛 Court / Judgment
                💡 Advice / Recommendation
                1️⃣, 2️⃣, 3️⃣ for numbered steps"""
        },
        {"role": "user", "content": message}
    ]
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    input_ids = tokenizer.encode(prompt)

    return input_ids

# ---------------- AI Generation ----------------
def generate_bot_response(message, model='LAWGPT-4'):
    try:
        model = model.upper()
        api_url = MODEL_ENDPOINTS.get(model, MODEL_ENDPOINTS['LAWGPT-4'])
        print(f"🔗 Sending to {api_url} for model {model}")

        if model == 'LAWGPT-3.5':
            input_ids = encode_message_for_lawgpt(message)
            body = {"input_ids": input_ids, "max_length": 200}
        else:
            body = {"query": message}

        response = requests.post(api_url, json=body, headers={"Content-Type": "application/json"}, timeout=60)
        print(f"📡 Response: {response.status_code}")
        if not response.ok:
            raise Exception(f"Server error: {response.status_code} - {response.text}")

        data = response.json()
        generated_text = data.get("response") or data.get("generated_text") or data.get("text") or ""

        # Only trim prompt for LAWGPT-3.5
        if model == 'LAWGPT-3.5' and generated_text:
            prompt_len = len(tokenizer.decode(input_ids, skip_special_tokens=True))
            final_output = generated_text[prompt_len:].strip()
        else:
            final_output = generated_text.strip()

        print("final_output:", final_output)
        return final_output or "⚠️ No response generated from model."

    except Exception as e:
        print(f"❌ generateBotResponse error: {e}")
        return f"⚠️ Sorry, I could not process your request: {str(e)}"

# ---------------- Chat Handler ----------------


@app.route("/api/chat", methods=["POST"])
@authenticate_token
def handle_message():
    try:
        user_id = request.user.get("id")
        data = request.get_json()
        message = data.get("message")
        session_id = data.get("sessionId")
        model = data.get("model", "LAWGPT-4")

        if not message or not user_id:
            return jsonify({"error": "Missing message or userId"}), 400

        print(f"📨 Processing message for user {user_id}, session {session_id}")

        # Generate bot response from AI model
        bot_reply = generate_bot_response(message, model)

        # Send to Node.js server to save in MongoDB
        auth_header = request.headers.get("Authorization")
        if auth_header and not auth_header.startswith("Bearer "):
            auth_header = f"Bearer {auth_header}"

        try:
            print(f"📡 Sending request to Node.js server at {NODE_SERVER_URL}/api/conversation/save")
            node_response = requests.post(
                f"{NODE_SERVER_URL}/api/conversation/save",
                json={
                    "userId": user_id,
                    "sessionId": session_id,
                    "userMessage": message,
                    "botMessage": bot_reply,
                    "model": model
                },
                headers={
                    "Authorization": auth_header,
                    "Content-Type": "application/json"
                },
                timeout=10
            )

            if not node_response.ok:
                print(f"❌ Node.js server error: {node_response.status_code} - {node_response.text}")
                raise Exception(f"Failed to save to MongoDB: {node_response.status_code}")

            saved_data = node_response.json()
            print(f"✅ Successfully saved conversation to MongoDB for session {saved_data.get('session', {}).get('_id', 'unknown')}")

        except requests.exceptions.RequestException as e:
            print(f"❌ Request error to Node.js server: {e}")
            raise Exception(f"Failed to connect to Node.js server: {str(e)}")
        except Exception as e:
            print(f"❌ Error saving to MongoDB: {e}")
            raise Exception(f"Failed to save conversation: {str(e)}")

        return jsonify({
            "session": saved_data.get("session"),
            "botReply": bot_reply
        }), 200

    except Exception as e:
        print(f"❌ handle_message error: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------- Health Check ----------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "Flask Chat Server"}), 200

# ---------------- Main ----------------
if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5001))
    print(f"🚀 Flask Chat Server starting on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)