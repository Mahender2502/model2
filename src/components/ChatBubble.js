import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatBubble = ({
  message,
  isUser,
  timestamp,
  messageId,
  fileMetadata,  // NEW: Accept fileMetadata prop
  onEdit,
  onEditSubmit,
  onEditCancel,
  isInEditMode = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [editText, setEditText] = useState(message);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Custom markdown components for better styling
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="my-4 rounded-lg overflow-hidden">
          <div className="bg-gray-800 dark:bg-gray-900 px-4 py-2 text-xs text-gray-300 font-mono flex justify-between items-center">
            <span>{match[1]}</span>
            <button
              onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
              className="text-gray-400 hover:text-white transition-colors"
              title="Copy code"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: '0.875rem',
              padding: '1rem',
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className="bg-gray-200 dark:bg-gray-700 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },
    table({ children }) {
      return (
        <div className="my-4 overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }) {
      return (
        <thead className="bg-gray-100 dark:bg-gray-700">{children}</thead>
      );
    },
    th({ children }) {
      return (
        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-sm">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
          {children}
        </td>
      );
    },
    ul({ children }) {
      return (
        <ul className="list-disc list-inside my-2 space-y-1 ml-4">{children}</ul>
      );
    },
    ol({ children }) {
      return (
        <ol className="list-decimal list-inside my-2 space-y-1 ml-4">{children}</ol>
      );
    },
    li({ children }) {
      return <li className="text-sm leading-relaxed">{children}</li>;
    },
    p({ children }) {
      return <p className="text-sm leading-relaxed my-2">{children}</p>;
    },
    h1({ children }) {
      return <h1 className="text-2xl font-bold my-3">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-xl font-bold my-3">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-lg font-semibold my-2">{children}</h3>;
    },
    h4({ children }) {
      return <h4 className="text-base font-semibold my-2">{children}</h4>;
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic text-gray-700 dark:text-gray-300">
          {children}
        </blockquote>
      );
    },
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {children}
        </a>
      );
    },
    strong({ children }) {
      return <strong className="font-bold">{children}</strong>;
    },
    em({ children }) {
      return <em className="italic">{children}</em>;
    },
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
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
    setEditText(message);
    if (onEditCancel) {
      onEditCancel(messageId);
    }
  };

  const getFileIcon = (fileType) => {
    switch(fileType) {
      case 'pdf':
        return '📄';
      case 'docx':
      case 'doc':
        return '📝';
      case 'txt':
        return '📃';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full py-2"
    >
      <div className="max-w-3xl mx-auto px-4">
        {isUser ? (
          /* User Message - Bubble Style on Right */
          <div className="flex justify-end items-start w-full gap-3">
            <div
              className="relative flex flex-col items-end"
              onMouseEnter={() => !isInEditMode && setIsHovered(true)}
              onMouseLeave={() => !isInEditMode && setIsHovered(false)}
            >
              {/* Message Bubble */}
              <div
                className={`
                  px-4 py-3 rounded-2xl bg-blue-600 text-white shadow-sm break-words max-w-[70vw] md:max-w-[500px]
                  ${isInEditMode ? 'ring-2 ring-blue-400' : ''}
                `}
                style={{
                  borderBottomRightRadius: '0.375rem'
                }}
              >
                {/* File Metadata Display */}
                {fileMetadata && (
                  <div className="mb-3 pb-3 border-b border-blue-400">
                    <div className="flex items-center space-x-2 bg-blue-500/30 px-3 py-2 rounded-lg">
                      <span className="text-xl">{getFileIcon(fileMetadata.fileType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-white">
                          {fileMetadata.fileName}
                        </p>
                        <p className="text-xs text-blue-100">
                          {fileMetadata.fileType?.toUpperCase()} • {formatFileSize(fileMetadata.fileSize)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Text */}
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
                    className="text-sm whitespace-pre-wrap outline-none leading-relaxed"
                    style={{ minHeight: 'inherit' }}
                  >
                    {editText}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message}</p>
                )}
              </div>
            ) : (
              // <p className="text-sm whitespace-pre-wrap">{message}</p>
              <div className="prose dark:prose-invert max-w-none text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message}
                </ReactMarkdown>
              </div>

            )}
          </div>

              {/* Edit Mode Buttons */}
              {isInEditMode && (
                <div className="mt-3 flex justify-end space-x-2">
                  <button
                    onClick={handleEditCancel}
                    className="px-4 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    disabled={!editText.trim() || editText.trim() === message}
                    className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Send
                  </button>
                </div>
              )}

              {/* Timestamp and Action buttons */}
              {!isInEditMode && (
                <div className="mt-1.5 flex items-center justify-end space-x-3">
                  {/* Only show action buttons if message has text content */}
                  {message && message.trim() && (
                    <div
                      className={`flex space-x-1 transition-opacity duration-150 ${
                        isHovered ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {/* Copy Button */}
                      <button
                        onClick={handleCopy}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Copy message"
                      >
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={handleEditClick}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Edit message"
                      >
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-500">{timestamp}</span>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mt-0.5">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        ) : (
          /* Bot Message - Plain Text Style on Left */
          <div className="flex items-start gap-3">
            {/* Bot Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mt-0.5">
              <span className="text-white text-base font-semibold">⚖️</span>
            </div>

            {/* Message Container */}
            <div
              className="flex-1 min-w-0 relative"
              onMouseEnter={() => !isInEditMode && setIsHovered(true)}
              onMouseLeave={() => !isInEditMode && setIsHovered(false)}
            >

              {/* Message Content */}
              <div
                className="text-gray-800 dark:text-gray-100 break-words relative"
                style={{
                  minHeight: '1.5rem',
                  position: 'relative'
                }}
              >
              {/* File Metadata Display */}
              {fileMetadata && (
                <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                    <span className="text-xl">{getFileIcon(fileMetadata.fileType)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                        {fileMetadata.fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {fileMetadata.fileType?.toUpperCase()} • {formatFileSize(fileMetadata.fileSize)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Text */}
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
                  className="text-sm whitespace-pre-wrap outline-none leading-relaxed"
                  style={{ minHeight: 'inherit' }}
                >
                  {editText}
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {message}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Edit Mode Buttons */}
            {isInEditMode && (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleEditCancel}
                  className="px-4 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={!editText.trim() || editText.trim() === message}
                  className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Send
                </button>
              </div>
            )}

            {/* Timestamp and Action buttons */}
            {!isInEditMode && (
              <div className="mt-2 flex items-center space-x-3">
                <span className="text-xs text-gray-500 dark:text-gray-500">{timestamp}</span>
                
                {/* Only show action buttons if message has text content */}
                {message && message.trim() && (
                  <div
                    className={`flex space-x-1 transition-opacity duration-150 ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Copy message"
                    >
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatBubble;