
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const ChatSidebar = ({
  isOpen,
  onToggle,
  conversations, // MongoDB sessions from backend
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}) => {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const getConversationPreview = (messages) => {
    if (!messages || messages.length === 0) return "New legal consultation";
    
    // Find the last user message for preview
    const userMessages = messages.filter(msg => msg.isUser);
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      return lastUserMessage.message.length > 35 
        ? lastUserMessage.message.substring(0, 35) + "..."
        : lastUserMessage.message;
    }
    
    // Fallback to last message if no user messages
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      return lastMessage.message.length > 35 
        ? lastMessage.message.substring(0, 35) + "..."
        : lastMessage.message;
    }
    
    return "New legal consultation";
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div
        className={`
        ${isOpen ? "w-72" : "w-0"} 
        flex-shrink-0 
        transition-all duration-300 ease-in-out
        relative
        overflow-hidden
      `}
      >
        <div
          className={`
          absolute left-0 top-0 h-full w-72 
          bg-white dark:bg-gray-800 
          border-r border-gray-200 dark:border-gray-700 
          z-50 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:z-auto
          ${!isOpen ? "lg:-translate-x-full" : ""}
        `}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chats
              </h2>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                title={isOpen ? "Close Sidebar" : "Open Sidebar"}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
              </button>
            </div>

            {/* New Session Button */}
            <div className="p-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onNewConversation}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Legal Consultation
              </motion.button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent px-2 pb-4">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">⚖️</div>
                  <p className="font-medium">No consultations yet</p>
                  <p className="text-sm mt-1">Start a new legal consultation</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <motion.div
                      key={conversation.id}
                      layout
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => onSelectConversation(conversation.id)}
                      className={`
                        group relative p-3 rounded-lg cursor-pointer transition-all duration-200
                        ${
                          activeConversationId === conversation.id
                            ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 shadow-sm"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">
                            {conversation.title || "New Chat"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {getConversationPreview(conversation.messages)}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(conversation.updatedAt || conversation.createdAt)}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {conversation.messages?.length || 0} msgs
                            </p>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this conversation?')) {
                              onDeleteConversation(conversation.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-200 flex-shrink-0"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                <p>🔒 Your conversations are securely stored</p>
                <p className="mt-1">LAWGPT • Legal AI Assistant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;