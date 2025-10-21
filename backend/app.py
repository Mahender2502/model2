from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer
import requests
import os
from dotenv import load_dotenv
import jwt
from functools import wraps
from huggingface_hub import login
# Import semantic search engine and file processor
from semantic_search import SemanticSearchEngine, fetch_session_messages
from file_processing_service import file_processor

load_dotenv()

app = Flask(__name__)
CORS(app)

# ---------------- Config ----------------
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret_key")
NODE_SERVER_URL = os.getenv("NODE_SERVER_URL", "http://localhost:5000")
ENABLE_SEMANTIC_SEARCH = os.getenv("ENABLE_SEMANTIC_SEARCH", "true").lower() == "true"
TOP_N_RELEVANT_MESSAGES = int(os.getenv("TOP_N_RELEVANT_MESSAGES", "5"))
RECENCY_WEIGHT = float(os.getenv("RECENCY_WEIGHT", "0.3"))

# Load tokenizer for LAWGPT-3.5
try:
    HF_TOKEN = os.getenv("HF_TOKEN")
    login(HF_TOKEN)
    tokenizer = AutoTokenizer.from_pretrained("google/gemma-3-1b-it")
    print("✅ Tokenizer loaded successfully")
except Exception as e:
    print(f"⚠️ Warning: Tokenizer not loaded: {e}")
    tokenizer = None

# Initialize Semantic Search Engine
semantic_engine = None
if ENABLE_SEMANTIC_SEARCH:
    try:
        semantic_engine = SemanticSearchEngine(model_name="all-MiniLM-L6-v2")
        print("✅ Semantic Search Engine initialized")
    except Exception as e:
        print(f"⚠️ Warning: Semantic Search Engine not initialized: {e}")
        semantic_engine = None

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
            request.token = token
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
                ⚖️ Law / Legal principle
                🔍 Research / Case references
                📄 Document / Contract
                ⚠️ Risk / Warning
                🏛️ Court / Judgment
                💡 Advice / Recommendation
                1️⃣, 2️⃣, 3️⃣ for numbered steps"""
        },
        {"role": "user", "content": message}
    ]
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    input_ids = tokenizer.encode(prompt)
    return input_ids

# ---------------- Semantic Context Builder ----------------
def build_semantic_context(message, session_id, user_id, token):
    if not semantic_engine or not ENABLE_SEMANTIC_SEARCH:
        print("📄 Semantic search disabled, using original message")
        return message
    
    if not session_id or session_id in ["null", "undefined"]:
        print("📄 No session ID, using original message")
        return message
    
    try:
        past_messages = fetch_session_messages(
            session_id=session_id,
            user_id=user_id,
            token=token,
            node_server_url=NODE_SERVER_URL
        )
        
        if not past_messages or len(past_messages) < 2:
            print("📄 Not enough past messages for context")
            return message
        
        relevant_messages = semantic_engine.get_relevant_messages(
            current_message=message,
            past_messages=past_messages,
            top_n=TOP_N_RELEVANT_MESSAGES,
            recency_weight=RECENCY_WEIGHT
        )
        
        if not relevant_messages:
            print("📄 No relevant messages found")
            return message
        
        print(f"🎯 Found {len(relevant_messages)} relevant messages")
        for i, msg in enumerate(relevant_messages[:3]):
            print(f"   {i+1}. {msg['sender']}: {msg['message'][:50]}... (score: {msg['similarity_score']:.3f})")
        
        context_message = semantic_engine.build_context_prompt(
            current_message=message,
            relevant_messages=relevant_messages,
            max_context_length=2000
        )
        
        return context_message
        
    except Exception as e:
        print(f"⚠️ Error building semantic context: {e}")
        return message

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

        response = requests.post(api_url, json=body, headers={"Content-Type": "application/json"}, timeout=80)
        print(f"📡 Response: {response.status_code}")
        if not response.ok:
            raise Exception(f"Server error: {response.status_code} - {response.text}")

        data = response.json()
        generated_text = data.get("response") or data.get("generated_text") or data.get("text") or ""

        if model == 'LAWGPT-3.5' and generated_text:
            prompt_len = len(tokenizer.decode(input_ids, skip_special_tokens=True))
            final_output = generated_text[prompt_len:].strip()
        else:
            final_output = generated_text.strip()

        print("final_output:", final_output[:100] + "..." if len(final_output) > 100 else final_output)
        return final_output or "⚠️ No response generated from model."

    except Exception as e:
        print(f"❌ generateBotResponse error: {e}")
        return f"⚠️ Sorry, I could not process your request: {str(e)}"

# ---------------- File Upload + Chat Handler ----------------
@app.route("/api/chat/upload", methods=["POST"])
@authenticate_token
def handle_file_upload():
    """
    Handle file upload with chat message
    Accepts: multipart/form-data with 'message', 'file', 'sessionId', 'model'
    """
    try:
        user_id = request.user.get("id")
        token = request.token
        
        # Extract form data
        message = request.form.get("message", "").strip()
        session_id = request.form.get("sessionId")
        model = request.form.get("model", "LAWGPT-4")
        use_context = request.form.get("useContext", "true").lower() == "true"
        
        print(f"📤 File upload request from user {user_id}")
        print(f"   Message: {message[:50] if message else 'None'}...")
        print(f"   Session: {session_id}")
        print(f"   Model: {model}")
        
        # Extract file if present
        file = request.files.get("file")
        
        if not file:
            return jsonify({"error": "No file provided"}), 400
        
        if not file.filename:
            return jsonify({"error": "Invalid file"}), 400
        
        print(f"📎 Processing file: {file.filename}")
        
        # Process file using file processor
        result = file_processor.process_file(file, file.filename)
        
        if not result['success']:
            return jsonify({
                "error": f"File processing failed: {result['error']}"
            }), 400
        
        extracted_text = result['extracted_text']
        file_metadata = {
            'fileName': result['filename'],
            'fileType': result['file_type'],
            'fileSize': result['file_size']
        }
        
        print(f"✅ File processed: {result['filename']} ({result['file_size']} bytes)")
        print(f"   Extracted {len(extracted_text)} characters")
        
        # Combine message and extracted text
        if message:
            combined_message = f"{message}\n\n📄 **Attached Document Content:**\n\n{extracted_text}"
        else:
            combined_message = f"Please analyze this document:\n\n{extracted_text}"
        
        # Build semantic context if enabled
        enhanced_message = combined_message
        if use_context and ENABLE_SEMANTIC_SEARCH and session_id and session_id not in ["null", "undefined"]:
            enhanced_message = build_semantic_context(
                message=combined_message,
                session_id=session_id,
                user_id=user_id,
                token=token
            )
            
            if enhanced_message != combined_message:
                print(f"   ✨ Enhanced with context ({len(enhanced_message)} chars)")
        
        # Generate bot response
        bot_reply = generate_bot_response(enhanced_message, model)
        
        # Save to Node.js MongoDB
        auth_header = request.headers.get("Authorization")
        if auth_header and not auth_header.startswith("Bearer "):
            auth_header = f"Bearer {auth_header}"
        
        # Prepare user message to save (include file indicator)
        user_message_to_save = message or f"[Uploaded file: {file_metadata['fileName']}]"
        
        try:
            print(f"📡 Sending to Node.js server at {NODE_SERVER_URL}/api/conversation/save")
            node_response = requests.post(
                f"{NODE_SERVER_URL}/api/conversation/save",
                json={
                    "userId": user_id,
                    "sessionId": session_id,
                    "userMessage": user_message_to_save,
                    "botMessage": bot_reply,
                    "model": model,
                    "fileMetadata": file_metadata  # Include file metadata
                },
                headers={
                    "Authorization": auth_header,
                    "Content-Type": "application/json"
                },
                timeout=10
            )

            if not node_response.ok:
                error_text = node_response.text
                print(f"❌ Node.js server error: {node_response.status_code} - {error_text}")
                raise Exception(f"Failed to save to MongoDB: {node_response.status_code}")

            saved_data = node_response.json()
            print(f"✅ Successfully saved to MongoDB for session {saved_data.get('session', {}).get('_id', 'unknown')}")

        except requests.exceptions.RequestException as e:
            print(f"❌ Request error to Node.js server: {e}")
            raise Exception(f"Failed to connect to Node.js server: {str(e)}")
        except Exception as e:
            print(f"❌ Error saving to MongoDB: {e}")
            raise Exception(f"Failed to save conversation: {str(e)}")

        return jsonify({
            "session": saved_data.get("session"),
            "botReply": bot_reply,
            "fileMetadata": file_metadata,
            "contextUsed": enhanced_message != combined_message
        }), 200

    except Exception as e:
        print(f"❌ handle_file_upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------- Regular Chat Handler ----------------
@app.route("/api/chat", methods=["POST"])
@authenticate_token
def handle_message():
    try:
        user_id = request.user.get("id")
        token = request.token
        data = request.get_json()
        message = data.get("message")
        session_id = data.get("sessionId")
        model = data.get("model", "LAWGPT-4")
        use_context = data.get("useContext", True)
        is_edit = data.get("isEdit", False)

        if not message or not user_id:
            return jsonify({"error": "Missing message or userId"}), 400

        print(f"💬 Processing message for user {user_id}, session {session_id}, isEdit={is_edit}")

        enhanced_message = message
        if use_context and ENABLE_SEMANTIC_SEARCH and not is_edit:
            enhanced_message = build_semantic_context(
                message=message,
                session_id=session_id,
                user_id=user_id,
                token=token
            )
            
            if enhanced_message != message:
                print(f"   ✨ Enhanced with context ({len(enhanced_message)} chars)")

        bot_reply = generate_bot_response(enhanced_message, model)

        auth_header = request.headers.get("Authorization")
        if auth_header and not auth_header.startswith("Bearer "):
            auth_header = f"Bearer {auth_header}"

        try:
            node_response = requests.post(
                f"{NODE_SERVER_URL}/api/conversation/save",
                json={
                    "userId": user_id,
                    "sessionId": session_id,
                    "userMessage": message,
                    "botMessage": bot_reply,
                    "model": model,
                    "isEdit": is_edit
                },
                headers={
                    "Authorization": auth_header,
                    "Content-Type": "application/json"
                },
                timeout=10
            )

            if not node_response.ok:
                raise Exception(f"Failed to save to MongoDB: {node_response.status_code}")

            saved_data = node_response.json()

        except Exception as e:
            raise Exception(f"Failed to save conversation: {str(e)}")

        return jsonify({
            "session": saved_data.get("session"),
            "botReply": bot_reply,
            "contextUsed": enhanced_message != message
        }), 200

    except Exception as e:
        print(f"❌ handle_message error: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------- Health Check ----------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy", 
        "service": "Flask Chat Server",
        "semantic_search": "enabled" if semantic_engine else "disabled",
        "file_upload": "enabled"
    }), 200

# ---------------- Main ----------------
if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5001))
    print(f"🚀 Flask Chat Server starting on port {port}...")
    print(f"🔍 Semantic Search: {'Enabled' if ENABLE_SEMANTIC_SEARCH and semantic_engine else 'Disabled'}")
    print(f"📎 File Upload: Enabled (PDF, DOCX, TXT)")
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)