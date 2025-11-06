# Backend (model2/backend)

This folder contains two services used by the LAWGPT application:

1. Node.js server (Express) — API, authentication, and MongoDB storage
2. Python Flask service — semantic search, file processing, RAG prompt building, and model orchestration

This README explains how to set up the environment, install dependencies, run the services, and test the main endpoints.

---

## Prerequisites

- Node.js (v16+ recommended)
- Python 3.10+ and pip
- Git
- MongoDB (local or remote)
- (Optional) Hugging Face token if you use HF-hosted models

---

## Environment

Copy `.env.example` to `.env` and fill in the values:

Windows cmd.EXE:

```cmd
cd /d c:\Users\sahar\lawgpt\model2\backend
copy .env.example .env
notepad .env
```

Fill in the required values (MONGO_URI, JWT_SECRET, FLASK_PORT, and any LLM endpoint tokens you need). Do NOT commit your `.env`.

---

## Python (Flask) service setup

1. Create and activate a virtual environment

```cmd
python -m venv .venv
.venv\Scripts\activate
```

2. Install Python dependencies

```cmd
pip install -r requirements.txt
```

3. Run the Flask service

```cmd
set FLASK_PORT=5001
python app.py
```

The Flask server exposes endpoints such as:
- `GET /health` — health check
- `POST /api/chat` — standard chat
- `POST /api/chat/with-file` — chat with pre-uploaded file metadata
- `POST /api/files/upload-only` — upload file and get extracted text
- `POST /api/rag` — RAG query (retrieval + generation using configured model endpoint)

Notes:
- RAG prompt construction happens in `rag_service.py`. The Flask app will send the prompt to the configured model endpoint (LAWGPT-3.5 by default in `app.py`).
- If you use heavy models locally, ensure the environment (CPU/GPU, torch) requirements are met.

---

## Node (Express) server setup

1. Install Node dependencies

```cmd
cd /d c:\Users\sahar\lawgpt\model2\backend
npm install
```

2. Start the Node server

```cmd
node server.js
```

The Node server exposes endpoints under `/api` such as:
- `/api/conversation` — create/save/fetch chat sessions
- `/api/files` — file related endpoints (if present)
- `/api/auth` — authentication endpoints

The Node server stores sessions in MongoDB (see `config/db.js`).

---

## Running the whole stack (recommended order)

1. Start MongoDB locally or ensure `MONGO_URI` points to a reachable instance.
2. Start Node server (port 5000)
3. Start Flask service (port 5001)
4. Launch frontend (project root `npm install` then `npm run start` or your existing script)

---

## Quick test (curl)

Replace `<token>` with a valid JWT token from your auth flow.

RAG test:

```cmd
curl -X POST http://localhost:5001/api/rag -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d "{\"query\": \"Explain Chapter 2 Section 4\"}"
```

Upload-only test (file extraction):

```cmd
curl -X POST http://localhost:5001/api/files/upload-only -H "Authorization: Bearer <token>" -F "file=@C:\path\to\sample.pdf"
```

---

## Troubleshooting

- If you get errors related to embeddings or models, check `requirements.txt` and verify `sentence-transformers` and `torch` are installed correctly.
- If the LAWGPT-3.5 endpoint is not reachable, update the URL in `app.py` `MODEL_ENDPOINTS` and verify network connectivity.
- If `.env` is committed accidentally: remove it from the history (`git rm --cached backend/.env`) and rotate any leaked secrets.

---

## Helpful files to read next

- `app.py` — Flask entry point and model orchestration
- `semantic_search.py` — contextual retrieval
- `file_processing_service.py` — file extraction logic
- `rag_service.py` — retrieval-augmented prompt building
- `server.js` and `controllers/conversationController.js` — session storage and Node API

If you want, I can add a short `run-dev.bat` for Windows that starts both Node and Flask in separate consoles.
