"""
Semantic Search Module for LawGPT
Handles semantic similarity search for chat history
"""

from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple
import requests
import os

class SemanticSearchEngine:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the semantic search engine with a sentence transformer model.
        
        Args:
            model_name: Name of the sentence-transformers model to use
        """
        print(f"🔧 Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        print("✅ Embedding model loaded successfully")
    
    def encode_messages(self, messages: List[str]) -> np.ndarray:
        """
        Encode a list of messages into embeddings.
        
        Args:
            messages: List of message strings
            
        Returns:
            numpy array of embeddings
        """
        if not messages:
            return np.array([])
        
        embeddings = self.model.encode(messages, convert_to_tensor=False)
        return np.array(embeddings)
    
    def compute_similarity(self, query_embedding: np.ndarray, message_embeddings: np.ndarray) -> np.ndarray:
        """
        Compute cosine similarity between query and message embeddings.
        
        Args:
            query_embedding: Embedding of the current query
            message_embeddings: Embeddings of past messages
            
        Returns:
            Array of similarity scores
        """
        if len(message_embeddings) == 0:
            return np.array([])
        
        query_embedding = query_embedding.reshape(1, -1)
        similarities = cosine_similarity(query_embedding, message_embeddings)
        return similarities[0]
    
    def get_relevant_messages(
        self, 
        current_message: str, 
        past_messages: List[Dict], 
        top_n: int = 5,
        recency_weight: float = 0.3
    ) -> List[Dict]:
        """
        Retrieve top N relevant messages based on semantic similarity.
        
        Args:
            current_message: The current user message
            past_messages: List of past message dictionaries with 'sender', 'message', 'timestamp'
            top_n: Number of relevant messages to retrieve
            recency_weight: Weight for recency score (0-1), higher means more recent messages preferred
            
        Returns:
            List of top N relevant messages with similarity scores
        """
        if not past_messages or len(past_messages) == 0:
            return []
        
        # Filter only user and bot messages (exclude system messages if any)
        valid_messages = [
            msg for msg in past_messages 
            if msg.get('message') and msg.get('sender') in ['user', 'bot']
        ]
        
        if not valid_messages:
            return []
        
        # Encode current message
        current_embedding = self.encode_messages([current_message])
        
        # Encode past messages
        past_message_texts = [msg['message'] for msg in valid_messages]
        past_embeddings = self.encode_messages(past_message_texts)
        
        # Compute semantic similarity
        similarities = self.compute_similarity(current_embedding, past_embeddings)
        
        # Add recency score (normalize by position, most recent = 1.0)
        recency_scores = np.linspace(0, 1, len(valid_messages))
        
        # Combined score: semantic similarity + recency
        combined_scores = (1 - recency_weight) * similarities + recency_weight * recency_scores
        
        # Get top N indices
        top_indices = np.argsort(combined_scores)[::-1][:top_n]
        
        # Build result with scores
        relevant_messages = []
        for idx in top_indices:
            msg = valid_messages[idx].copy()
            msg['similarity_score'] = float(similarities[idx])
            msg['combined_score'] = float(combined_scores[idx])
            relevant_messages.append(msg)
        
        return relevant_messages
    
    def build_context_prompt(
        self, 
        current_message: str, 
        relevant_messages: List[Dict],
        max_context_length: int = 2000
    ) -> str:
        """
        Build a context-aware prompt for the model.
        
        Args:
            current_message: The current user message
            relevant_messages: List of relevant past messages
            max_context_length: Maximum character length for context
            
        Returns:
            Formatted prompt string with context
        """
        if not relevant_messages:
            return current_message
        
        # Build context from relevant messages
        context_parts = ["Based on our previous conversation:\n"]
        current_length = len(context_parts[0])
        
        for msg in relevant_messages:
            sender = "User" if msg['sender'] == 'user' else "Assistant"
            message_text = f"{sender}: {msg['message']}\n"
            
            if current_length + len(message_text) > max_context_length:
                break
            
            context_parts.append(message_text)
            current_length += len(message_text)
        
        context_parts.append(f"\nCurrent question: {current_message}")
        
        return "\n".join(context_parts)


def fetch_session_messages(session_id: str, user_id: str, token: str, node_server_url: str) -> List[Dict]:
    """
    Fetch messages from a chat session via Node.js server.
    
    Args:
        session_id: The chat session ID
        user_id: The user ID
        token: JWT authentication token
        node_server_url: URL of the Node.js server
        
    Returns:
        List of message dictionaries
    """
    try:
        # Get all sessions for the user
        response = requests.get(
            f"{node_server_url}/api/conversation",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=5
        )
        
        if not response.ok:
            print(f"⚠️ Failed to fetch sessions: {response.status_code}")
            return []
        
        sessions = response.json()
        
        # Find the specific session
        target_session = None
        for session in sessions:
            if str(session.get('_id')) == str(session_id):
                target_session = session
                break
        
        if not target_session:
            print(f"⚠️ Session {session_id} not found")
            return []
        
        messages = target_session.get('messages', [])
        print(f"📚 Retrieved {len(messages)} messages from session {session_id}")
        return messages
        
    except Exception as e:
        print(f"❌ Error fetching session messages: {e}")
        return []