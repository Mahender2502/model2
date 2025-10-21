

// import React, { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Paperclip } from "lucide-react";

// const MessageInput = ({ onSendMessage, isLoading, selectedModel, onModelChange, onFileUpload }) => {
//   const [message, setMessage] = useState("");
//   const [showModelSelector, setShowModelSelector] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const textareaRef = useRef(null);
//   const dropdownRef = useRef(null);
//   const fileInputRef = useRef(null);

//   const availableModels = [
//     { id: "LAWGPT-4", name: "LAWGPT-4", description: "Most capable legal AI model" },
//     { id: "LAWGPT-3.5", name: "LAWGPT-3.5", description: "Faster responses, good for general queries" },
//     { id: "Legal-Pro", name: "Legal-Pro", description: "Specialized for complex legal analysis" },
//     { id: "Contract-AI", name: "Contract-AI", description: "Expert in contract law and review" },
//     { id: "LitAssist", name: "LitAssist", description: "Litigation and case law specialist" },
//   ];

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (message.trim() && !isLoading) {
//       onSendMessage(message.trim(), selectedModel);
//       setMessage("");
//     }
//   };

//   const handleFileSelect = (e) => {
//     const files = Array.from(e.target.files);
//     const validFiles = files.filter(file => {
//       const allowedTypes = [
//         'application/pdf',
//         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         'application/msword',
//         'image/jpeg',
//         'image/png',
//         'image/gif',
//         'image/webp'
//       ];
//       return allowedTypes.includes(file.type);
//     });

//     if (validFiles.length !== files.length) {
//       alert('Some files were skipped. Only PDF, Word documents, and images are allowed.');
//     }

//     const maxSize = 10 * 1024 * 1024; // 10MB
//     const oversizedFiles = validFiles.filter(file => file.size > maxSize);

//     if (oversizedFiles.length > 0) {
//       alert('Some files are too large. Maximum file size is 10MB.');
//       return;
//     }

//     setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
//   };

//   const removeFile = (index) => {
//     setSelectedFiles(prev => prev.filter((_, i) => i !== index));
//   };

//   const handleFileUpload = async () => {
//     if (selectedFiles.length === 0) return;

//     // const formData = new FormData();
//     // selectedFiles.forEach((file, index) => {
//     //   formData.append(`file-${index}`, file);
//     // });
//     const formData = new FormData();
// formData.append('file', selectedFiles[0]); // Flask expects single 'file' key
// formData.append('message', message || ''); // Current message
// formData.append('sessionId', activeConversationId); // From Chat.js
// formData.append('model', selectedModel);

//     try {
//       const response = await fetch('http://localhost:5001/api/chat/upload', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: formData
//       });

//       if (!response.ok) {
//         throw new Error('Upload failed');
//       }

//       const uploadedFiles = await response.json();
//       if (onFileUpload) {
//         onFileUpload(uploadedFiles);
//       }

//       // Add upload success message to chat
//       const fileNames = uploadedFiles.map(file => file.originalName).join(', ');
//       onSendMessage(`📎 You uploaded: ${fileNames}`, selectedModel);

//       setSelectedFiles([]);
//     } catch (error) {
//       console.error('File upload error:', error);
//       alert('Failed to upload files. Please try again.');
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSubmit(e);
//     }
//   };

//   const handleTextareaChange = (e) => {
//     setMessage(e.target.value);
//     adjustTextareaHeight();
//   };

//   const adjustTextareaHeight = () => {
//     if (textareaRef.current) {
//       textareaRef.current.style.height = "44px";
//       textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
//     }
//   };

//   const handleModelSelect = (modelId) => {
//     onModelChange(modelId);
//     setShowModelSelector(false);
//   };

//   // ✅ Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setShowModelSelector(false);
//       }
//     };
//     if (showModelSelector) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [showModelSelector]);

//   useEffect(() => {
//     adjustTextareaHeight();
//   }, [message]);

//   return (
//     <div className="p-4 max-w-3xl mx-auto w-full">
//       <form onSubmit={handleSubmit}>
//         {/* Input Container */}
//         <div className="relative flex items-center border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 shadow-sm px-2">
          
//           {/* File Upload Button */}
//           <motion.button
//             type="button"
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={() => fileInputRef.current?.click()}
//             className="absolute left-2 flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
//             title="Attach files"
//           >
//             <Paperclip className="w-5 h-5" />
//           </motion.button>

//           {/* Model Selector Button */}
//           <motion.button
//             type="button"
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={() => setShowModelSelector((prev) => !prev)}
//             className="absolute left-12 flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//             </svg>
//           </motion.button>

//           {/* Textarea */}
//           <textarea
//             ref={textareaRef}
//             value={message}
//             onChange={handleTextareaChange}
//             onKeyPress={handleKeyPress}
//             placeholder="Type your legal question here..."
//             disabled={isLoading}
//             className="w-full px-20 py-3 pr-12 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none overflow-hidden"
//             rows="1"
//             style={{
//               minHeight: "44px",
//               maxHeight: "none",
//             }}
//           />

//           {/* Send Button */}
//           <motion.button
//             whileHover={{ scale: isLoading || !message.trim() ? 1 : 1.05 }}
//             whileTap={{ scale: isLoading || !message.trim() ? 1 : 0.95 }}
//             type="submit"
//             disabled={!message.trim() || isLoading}
//             className={`absolute right-2 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
//               !message.trim() || isLoading
//                 ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
//                 : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
//             }`}
//           >
//             {isLoading ? (
//               <motion.div
//                 animate={{ rotate: 360 }}
//                 transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//                 className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
//               />
//             ) : (
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
//               </svg>
//             )}
//           </motion.button>

//           {/* Hidden File Input */}
//           <input
//             ref={fileInputRef}
//             type="file"
//             multiple
//             accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
//             onChange={handleFileSelect}
//             className="hidden"
//           />

//           {/* Popover Dropdown */}
//           <AnimatePresence>
//             {showModelSelector && (
//               <motion.div
//                 ref={dropdownRef}
//                 initial={{ opacity: 0, y: 8 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: 8 }}
//                 transition={{ duration: 0.2 }}
//                 className="absolute bottom-14 left-12 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 p-2"
//               >
//                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Choose AI Model</p>
//                 <div className="space-y-1">
//                   {availableModels.map((model) => (
//                     <motion.button
//                       key={model.id}
//                       whileHover={{ scale: 1.02 }}
//                       onClick={() => handleModelSelect(model.id)}
//                       className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-900 dark:text-white ${
//                         selectedModel === model.id
//                           ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
//                           : "hover:bg-gray-100 dark:hover:bg-gray-700"
//                       }`}
//                     >
//                       {model.name}
//                     </motion.button>
//                   ))}
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>

//         {/* File Preview Area */}
//         <AnimatePresence>
//           {selectedFiles.length > 0 && (
//             <motion.div
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
//             >
//               <div className="flex items-center justify-between mb-2">
//                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                   Selected Files ({selectedFiles.length}/5)
//                 </span>
//                 <div className="flex space-x-2">
//                   <button
//                     type="button"
//                     onClick={handleFileUpload}
//                     className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
//                   >
//                     Upload Files
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => setSelectedFiles([])}
//                     className="px-3 py-1 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
//                   >
//                     Clear All
//                   </button>
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 {selectedFiles.map((file, index) => (
//                   <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-md">
//                     <div className="flex items-center space-x-2">
//                       <span className="text-xs text-gray-500 dark:text-gray-400">
//                         {file.type.startsWith('image/') ? '🖼️' : '📄'}
//                       </span>
//                       <span className="text-sm text-gray-900 dark:text-white truncate">
//                         {file.name}
//                       </span>
//                       <span className="text-xs text-gray-500 dark:text-gray-400">
//                         ({(file.size / 1024 / 1024).toFixed(2)} MB)
//                       </span>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => removeFile(index)}
//                       className="text-gray-400 hover:text-red-500 transition-colors"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                       </svg>
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </form>
//     </div>
//   );
// };

// export default MessageInput;


import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, X } from "lucide-react";

const MessageInput = ({ 
  onSendMessage, 
  isLoading, 
  selectedModel, 
  onModelChange, 
  onFileUpload,
  activeConversationId  // NEW: Added prop
}) => {
  const [message, setMessage] = useState("");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);  // Changed to single file
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const availableModels = [
    { id: "LAWGPT-4", name: "LAWGPT-4", description: "Most capable legal AI model" },
    { id: "LAWGPT-3.5", name: "LAWGPT-3.5", description: "Faster responses, good for general queries" },
    { id: "Legal-Pro", name: "Legal-Pro", description: "Specialized for complex legal analysis" },
    { id: "Contract-AI", name: "Contract-AI", description: "Expert in contract law and review" },
    { id: "LitAssist", name: "LitAssist", description: "Litigation and case law specialist" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If there's a file, handle file upload
    if (selectedFile) {
      handleFileUploadSubmit();
    } else if (message.trim() && !isLoading) {
      // Regular text message
      onSendMessage(message.trim(), selectedModel);
      setMessage("");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];  // Only take first file
    
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only PDF, Word documents, and TXT files are allowed.');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File is too large. Maximum file size is 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUploadSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('message', message.trim() || `Analyze this document: ${selectedFile.name}`);
    formData.append('sessionId', activeConversationId || '');
    formData.append('model', selectedModel);
    formData.append('useContext', 'true');

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5001/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Call the file upload handler with the response
      if (onFileUpload) {
        onFileUpload(data);
      }

      // Add upload success message to chat (like ChatGPT)
      const uploadMessage = `📎 You uploaded: ${selectedFile.name}`;
      onSendMessage(uploadMessage, selectedModel);

      // Clear the form
      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('File upload error:', error);
      alert(`Failed to upload file: ${error.message}`);
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
          
          {/* File Upload Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-2 flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Attach file"
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>

          {/* Model Selector Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModelSelector((prev) => !prev)}
            className="absolute left-12 flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            disabled={isLoading}
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
            placeholder={selectedFile ? `Add message for ${selectedFile.name}...` : "Type your legal question here..."}
            disabled={isLoading}
            className="w-full px-20 py-3 pr-12 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none overflow-hidden"
            rows="1"
            style={{
              minHeight: "44px",
              maxHeight: "none",
            }}
          />

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: isLoading || (!message.trim() && !selectedFile) ? 1 : 1.05 }}
            whileTap={{ scale: isLoading || (!message.trim() && !selectedFile) ? 1 : 0.95 }}
            type="submit"
            disabled={(!message.trim() && !selectedFile) || isLoading}
            className={`absolute right-2 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
              (!message.trim() && !selectedFile) || isLoading
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

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Model Selector Dropdown */}
          <AnimatePresence>
            {showModelSelector && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-14 left-12 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 p-2"
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

        {/* File Preview Area */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selected File
                </span>
                <button
                  type="button"
                  onClick={removeFile}
                  className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Remove
                </button>
              </div>
              <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-md">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    📄
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};

export default MessageInput;