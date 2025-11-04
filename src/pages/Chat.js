import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import ChatSidebar from '../components/ChatSidebar';
import ThemeToggle from '../components/ThemeToggle';
import useChatStore from '../stores/chatStore';

const Chat = () => {
  const {
    conversations,
    activeConversationId,
    isSidebarOpen,
    selectedModel,
    editingMessageId,
    setSelectedModel,
    fetchUserSessions,
    handleSendMessage,
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
    handleUpdateConversation,
    handleEditMessage,
    handleEditSubmit,
    handleEditCancel,
    handleFileUpload,
    toggleSidebar,
    getConversationLoadingState,
  } = useChatStore();

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const previousConversationIdRef = useRef(activeConversationId);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const activeConversationLoadingState = getConversationLoadingState(activeConversationId);
  const isActiveConversationTyping = activeConversationLoadingState?.isTyping || false;
  const isActiveConversationLoading = activeConversationLoadingState?.isLoading || false;

  // Scroll to bottom when messages change
  useEffect(() => {
    // If conversation changed (user switched to different session), scroll instantly
    const conversationChanged = previousConversationIdRef.current !== activeConversationId;
    
    messagesEndRef.current?.scrollIntoView({ 
      behavior: conversationChanged ? 'auto' : 'smooth' 
    });
    
    // Update the ref after scrolling
    previousConversationIdRef.current = activeConversationId;
  }, [conversations, activeConversationId, isActiveConversationTyping]);

  // Load conversations on component mount
  useEffect(() => {
    const { conversations } = useChatStore.getState();
    const activeLoadingState = getConversationLoadingState(activeConversationId);
    if (conversations.length === 0 && !activeLoadingState?.isTyping) {
      fetchUserSessions();
    }
  }, [fetchUserSessions, activeConversationId, getConversationLoadingState]);

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
      <div className="flex flex-col flex-1 min-w-0 relative z-[55]">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0 relative z-[65]">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors relative z-[70] ${isSidebarOpen ? 'lg:hidden' : 'lg:block'}`}
              title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
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
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          <div className="w-full pt-6">
            <AnimatePresence>
              {activeConversation && activeConversation.messages.map(msg => (
                <ChatBubble
                  key={msg.id}
                  message={msg.message}
                  isUser={msg.isUser}
                  timestamp={msg.timestamp}
                  messageId={msg.id}
                  fileMetadata={msg.fileMetadata}
                  onEdit={handleEditMessage}
                  onEditSubmit={handleEditSubmit}
                  onEditCancel={handleEditCancel}
                  isInEditMode={editingMessageId === msg.id}
                />
              ))}
              {isActiveConversationTyping && (
                <div className="w-full py-2">
                  <div className="max-w-3xl mx-auto px-4">
                    <div className="flex items-center gap-3">
                      {/* Bot Avatar */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-base font-semibold">⚖️</span>
                      </div>
                      <div className="flex items-center">
                        <TypingIndicator />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isActiveConversationLoading}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onFileUpload={handleFileUpload}
          activeConversationId={activeConversationId}
        />
      </div>
    </div>
  );
};

export default Chat;