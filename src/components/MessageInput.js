

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MessageInput = ({ onSendMessage, isLoading, selectedModel, onModelChange }) => {
  const [message, setMessage] = useState("");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  const availableModels = [
    { id: "LAWGPT-4", name: "LAWGPT-4", description: "Most capable legal AI model" },
    { id: "LAWGPT-3.5", name: "LAWGPT-3.5", description: "Faster responses, good for general queries" },
    { id: "Legal-Pro", name: "Legal-Pro", description: "Specialized for complex legal analysis" },
    { id: "Contract-AI", name: "Contract-AI", description: "Expert in contract law and review" },
    { id: "LitAssist", name: "LitAssist", description: "Litigation and case law specialist" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim(), selectedModel);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleModelSelect = (modelId) => {
    onModelChange(modelId);
    setShowModelSelector(false);
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowModelSelector(false);
      }
    };
    if (showModelSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModelSelector]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="p-4 max-w-3xl mx-auto w-full">
      <form onSubmit={handleSubmit}>
        {/* Input Container */}
        <div className="relative flex items-center border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 shadow-sm px-2">
          
          {/* + Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModelSelector((prev) => !prev)}
            className="absolute left-2 flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your legal question here..."
            disabled={isLoading}
            className="w-full px-10 py-3 pr-12 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none overflow-hidden"
            rows="1"
            style={{
              minHeight: "44px",
              maxHeight: "none",
            }}
          />

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: isLoading || !message.trim() ? 1 : 1.05 }}
            whileTap={{ scale: isLoading || !message.trim() ? 1 : 0.95 }}
            type="submit"
            disabled={!message.trim() || isLoading}
            className={`absolute right-2 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
              !message.trim() || isLoading
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            }`}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </motion.button>

          {/* Popover Dropdown */}
          <AnimatePresence>
            {showModelSelector && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-14 left-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 p-2"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Choose AI Model</p>
                <div className="space-y-1">
                  {availableModels.map((model) => (
                    <motion.button
                      key={model.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleModelSelect(model.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-900 dark:text-white ${
                        selectedModel === model.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {model.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
