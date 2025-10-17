
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import ChatSidebar from '../components/ChatSidebar';
import ThemeToggle from '../components/ThemeToggle';

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState('LAWGPT-4');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // API base URL - adjust this to match your backend URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Get auth token from localStorage
  const getAuthToken = () => localStorage.getItem('token');

  // Fetch user sessions from MongoDB
  const fetchUserSessions = async () => {
    try {
      setIsLoadingConversations(true);
      const token = getAuthToken();
      
      if (!token) {
        console.error('No auth token found');
        setIsLoadingConversations(false);
        return;
      }

      const url = `${API_BASE_URL}/conversation`;
      console.log('Fetching sessions from:', url);

      const res = await fetch(url, {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch sessions: ${res.status} - ${errorText}`);
      }
      
      const sessions = await res.json();
      console.log('Fetched sessions:', sessions);

      // Transform MongoDB sessions to frontend format
      const transformedSessions = sessions
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .map(session => ({
          id: session._id,
          title: session.title || 'New Chat',
          createdAt: new Date(session.createdAt).getTime(),
          updatedAt: new Date(session.updatedAt).getTime(),
          messages: (session.messages || []).map(msg => ({
            id: msg._id || `${Date.now()}-${Math.random()}`,
            message: msg.message, // Backend uses 'message' field
            isUser: msg.sender === 'user',
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
          })),
        }));

      setConversations(transformedSessions);
      
      // Auto-select most recent conversation or create new one
      if (transformedSessions.length > 0 && !activeConversationId) {
        setActiveConversationId(transformedSessions[0].id);
      } else if (transformedSessions.length === 0) {
        await handleNewConversation();
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      // Create a new conversation if fetching fails
      await handleNewConversation();
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConversationId, isTyping]);

  // Load conversations on component mount
  useEffect(() => {
    fetchUserSessions();
  }, []);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Send message to MongoDB backend
  const handleSendMessage = async (messageText, model) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      message: messageText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Optimistic UI update - add user message immediately
    if (activeConversation) {
      const updatedMessages = [...activeConversation.messages, userMessage];
      setConversations(prev =>
        prev.map(conv => 
          conv.id === activeConversationId 
            ? { ...conv, messages: updatedMessages }
            : conv
        )
      );
    }

    setIsLoading(true);
    setIsTyping(true);

    try {
      const token = getAuthToken();
      const url = 'http://localhost:5001/api/chat';
      console.log('Sending message to:', url);
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          message: messageText, 
          sessionId: activeConversationId,
          model: model || selectedModel
        }),
      });

      console.log('Message response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to send message: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log('Message sent successfully:', data);

      // Update conversation with the response from backend
      const updatedSession = {
        id: data.session._id,
        title: data.session.title,
        createdAt: new Date(data.session.createdAt).getTime(),
        updatedAt: new Date(data.session.updatedAt).getTime(),
        messages: data.session.messages.map(msg => ({
          id: msg._id || `${Date.now()}-${Math.random()}`,
          message: msg.message,
          isUser: msg.sender === 'user',
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
        })),
      };

      // Update the conversation in state
      setConversations(prev => {
        const updatedConversations = prev.map(conv =>
          conv.id === activeConversationId ? updatedSession : conv
        );
        
        // Sort by updatedAt to keep most recent first
        return updatedConversations.sort((a, b) => b.updatedAt - a.updatedAt);
      });

      // If this was a new conversation, update the active conversation ID
      if (data.session._id !== activeConversationId) {
        setActiveConversationId(data.session._id);
      }

    } catch (err) {
      console.error('Error sending message:', err);
      
      // Add error message to chat
      const errorMessage = {
        id: `error-${Date.now()}`,
        message: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (activeConversation) {
        const updatedMessages = [...activeConversation.messages, userMessage, errorMessage];
        setConversations(prev =>
          prev.map(conv => 
            conv.id === activeConversationId 
              ? { ...conv, messages: updatedMessages }
              : conv
          )
        );
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Create new conversation in MongoDB
  const handleNewConversation = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const url = `${API_BASE_URL}/conversation/new`;
      console.log('Creating new session at:', url);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ title: 'New Legal Consultation' }),
      });

      console.log('New session response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to create new session: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log('New session created:', data);

      const newConversation = {
        id: data._id,
        title: data.title,
        createdAt: new Date(data.createdAt).getTime(),
        updatedAt: new Date(data.updatedAt).getTime(),
        messages: data.messages.map(msg => ({
          id: msg._id || `${Date.now()}-${Math.random()}`,
          message: msg.message,
          isUser: msg.sender === 'user',
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
        })),
      };

      // Add new conversation to the beginning of the list
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      
      // Open sidebar on mobile after creating new conversation
      setIsSidebarOpen(true);
    } catch (err) {
      console.error('Error creating new conversation:', err);
      
      // Fallback: create a local conversation
      const fallbackConversation = {
        id: `temp-${Date.now()}`,
        title: 'New Legal Consultation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: 1,
            message: "Hello! I'm LAWGPT, your AI legal assistant. How can I help you with legal questions today?",
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };

      setConversations(prev => [fallbackConversation, ...prev]);
      setActiveConversationId(fallbackConversation.id);
    }
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    // Close sidebar on mobile when selecting a conversation
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Delete conversation from MongoDB
  const handleDeleteConversation = async (id) => {
    try {
      const token = getAuthToken();
      const url = `${API_BASE_URL}/conversation/${id}`;
      console.log('Deleting conversation at:', url);

      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('Delete response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);

        // Show user-friendly error message
        alert(`Failed to delete conversation: ${res.status === 404 ? 'Conversation not found' : 'Server error occurred'}`);
        throw new Error(`Failed to delete conversation: ${res.status} - ${errorText}`);
      }

      console.log('Conversation deleted successfully');

      // Remove conversation from state
      const remaining = conversations.filter(c => c.id !== id);
      setConversations(remaining);

      // Handle active conversation selection
      if (id === activeConversationId) {
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          // Create new conversation if no conversations left
          await handleNewConversation();
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);

      // Show error feedback to user if not already shown above
      if (!err.message.includes('Failed to delete conversation')) {
        alert('An error occurred while deleting the conversation. Please try again.');
      }
    }
  };

  // Update conversation title in MongoDB
  const handleUpdateConversation = async (conversationId, updates) => {
    try {
      const token = getAuthToken();

      if (!token) {
        console.error('No auth token found');
        return;
      }

      const url = `${API_BASE_URL}/conversation/${conversationId}`;
      console.log('Updating conversation at:', url);

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates),
      });

      console.log('Update response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);

        // Show user-friendly error message
        alert(`Failed to update conversation: ${res.status === 404 ? 'Conversation not found' : 'Server error occurred'}`);
        throw new Error(`Failed to update conversation: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log('Conversation updated successfully:', data);

      // Update the conversation in local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, title: data.title, updatedAt: new Date(data.updatedAt).getTime() }
            : conv
        ).sort((a, b) => b.updatedAt - a.updatedAt) // Re-sort by updatedAt
      );

    } catch (err) {
      console.error('Error updating conversation:', err);

      // Show error feedback to user if not already shown above
      if (!err.message.includes('Failed to update conversation')) {
        alert('An error occurred while updating the conversation. Please try again.');
      }
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="fixed inset-0 flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onUpdateConversation={handleUpdateConversation}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            {/* <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button> */}
             {!isSidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                title="Open Sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
            )}
            <div className="flex items-center space-x-2">
              <div className="text-2xl">⚖️</div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">LAWGPT</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Legal AI Assistant • {activeConversation?.title || 'No conversation'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Model: {selectedModel}
            </div>
            <ThemeToggle />
            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              title="User Profile"
              aria-label="User Profile"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto flex justify-center">
          <div className="w-full max-w-3xl p-4 space-y-4">
            <AnimatePresence>
              {activeConversation && activeConversation.messages.map(msg => (
                <ChatBubble 
                  key={msg.id} 
                  message={msg.message} 
                  isUser={msg.isUser} 
                  timestamp={msg.timestamp} 
                />
              ))}
              {isTyping && <TypingIndicator />}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>
    </div>
  );
};

export default Chat;