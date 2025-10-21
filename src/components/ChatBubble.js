import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ChatBubble = ({
  message,
  isUser,
  timestamp,
  messageId,
  onEdit,
  onEditSubmit,
  onEditCancel,
  isInEditMode = false
}) => {
  // Check if message contains file upload information
  const isFileUploadMessage = (message) => {
    return message.includes('📎 You uploaded:');
  };

  // Extract file information from upload message
  const extractFileInfo = (message) => {
    if (!isFileUploadMessage(message)) return null;

    // Extract filename from message like "📎 You uploaded: filename.pdf"
    const match = message.match(/📎 You uploaded: (.+)/);
    if (match) {
      return {
        type: 'file_upload',
        filename: match[1],
        displayMessage: message
      };
    }

    return {
      type: 'file_upload',
      files: [],
      displayMessage: message
    };
  };

  const fileInfo = extractFileInfo(message);

  const [isHovered, setIsHovered] = useState(false);
  const [editText, setEditText] = useState(message);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(messageId, message);
    }
  };

  const handleEditSubmit = () => {
    if (onEditSubmit && editText.trim() !== message) {
      onEditSubmit(messageId, editText.trim());
    }
  };

  const handleEditCancel = () => {
    setEditText(message); // Reset to original text
    if (onEditCancel) {
      onEditCancel(messageId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* Bot Avatar */}
        {!isUser && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md mr-2 mt-1">
            <span className="text-white text-lg font-semibold">⚖️</span>
          </div>
        )}

        {/* Message Container */}
        <div
          className="max-w-[60%] relative"
          onMouseEnter={() => !isInEditMode && setIsHovered(true)}
          onMouseLeave={() => !isInEditMode && setIsHovered(false)}
        >
          {/* Message Bubble */}
          <div
            className={`
              px-4 py-3 rounded-2xl shadow-sm break-words relative
              ${isUser
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'
              }
              ${isInEditMode ? 'ring-2 ring-blue-500' : ''}
            `}
            style={{
              minHeight: '2.5rem',
              position: 'relative'
            }}
          >
            {isInEditMode ? (
              <div
                contentEditable
                suppressContentEditableWarning
                ref={(div) => {
                  if (div && isInEditMode) {
                    setTimeout(() => {
                      div.focus();
                      const range = document.createRange();
                      const sel = window.getSelection();
                      range.selectNodeContents(div);
                      range.collapse(false);
                      sel.removeAllRanges();
                      sel.addRange(range);
                    }, 0);
                  }
                }}
                onInput={(e) => setEditText(e.currentTarget.textContent)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEditSubmit();
                  } else if (e.key === 'Escape') {
                    handleEditCancel();
                  }
                }}
                className="text-sm whitespace-pre-wrap outline-none"
                style={{ minHeight: 'inherit' }}
              >
                {editText}
              </div>
            ) : (
              <div>
                {fileInfo ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📎</span>
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap font-medium">You uploaded:</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {fileInfo.filename || 'File'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message}</p>
                )}
              </div>
            )}
          </div>

          {/* Edit Mode Buttons */}
          {isInEditMode && (
            <div className="mt-3 flex justify-end space-x-2">
              <button
                onClick={handleEditCancel}
                className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={!editText.trim() || editText.trim() === message}
                className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                Send
              </button>
            </div>
          )}

          {/* Timestamp */}
          {!isInEditMode && (
            <div className={`mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
              <span className="text-xs text-gray-500 dark:text-gray-400 opacity-75">{timestamp}</span>
            </div>
          )}

          {/* Action buttons */}
          {!isInEditMode && (
            <div
              className={`absolute transition-opacity duration-200 ease-in-out ${
                isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
              style={{
                bottom: '-2rem',
                [isUser ? 'right' : 'left']: '0'
              }}
            >
              <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} space-x-1`}>
                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center"
                  title="Copy message"
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Edit Button - Only for user messages */}
                {isUser && (
                  <button
                    onClick={handleEditClick}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center"
                    title="Edit message"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        {isUser && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-md ml-2 mt-1">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatBubble;
