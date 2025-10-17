import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ChatSidebar = ({
  isOpen,
  onToggle,
  conversations, // MongoDB sessions from backend
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onUpdateConversation,
}) => {
  const [renamingId, setRenamingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuToggle = (conversationId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === conversationId ? null : conversationId);
  };

  const handleRename = (conversationId, e) => {
    e.stopPropagation();
    const conversation = conversations.find(c => c.id === conversationId);
    setRenamingId(conversationId);
    setNewTitle(conversation.title || 'New Chat');
    setOpenMenuId(null);
  };

  const handleSaveRename = () => {
    if (newTitle.trim()) {
      onUpdateConversation(renamingId, { title: newTitle.trim() });
    }
    setRenamingId(null);
    setNewTitle('');
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setNewTitle('');
  };

  const handleDelete = (conversationId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDeleteConversation(conversationId);
    }
    setOpenMenuId(null);
  };

  const handleShare = (conversationId, e) => {
    e.stopPropagation();
    // Placeholder for share functionality
    alert('Share functionality coming soon!');
    setOpenMenuId(null);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
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
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(conversation.updatedAt || conversation.createdAt)}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {conversation.messages?.length || 0} msgs
                            </p>
                          </div>
                        </div>

                        {/* Menu Button */}
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleMenuToggle(conversation.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 flex-shrink-0"
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
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </motion.button>

                          {/* Dropdown Menu */}
                          <AnimatePresence>
                            {openMenuId === conversation.id && (
                              <motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute -left-48 top-full w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[1000]"
                              >
                                <div className="py-1">
                                  <button
                                    onClick={(e) => handleRename(conversation.id, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={(e) => handleShare(conversation.id, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    Share
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(conversation.id, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
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

      {/* Rename Modal */}
      <AnimatePresence>
        {renamingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Rename Conversation
              </h3>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter new title"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveRename();
                  }
                }}
              />
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={handleCancelRename}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRename}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSidebar;