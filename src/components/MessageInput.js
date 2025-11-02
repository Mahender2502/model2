// import React, { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Paperclip, X } from "lucide-react";

// const MessageInput = ({ 
//   onSendMessage, 
//   isLoading, 
//   selectedModel, 
//   onModelChange, 
//   onFileUpload,
//   activeConversationId
// }) => {
//   const [message, setMessage] = useState("");
//   const [showModelSelector, setShowModelSelector] = useState(false);
//   const [selectedFile, setSelectedFile] = useState(null);
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
    
//     // If there's a file, handle file upload
//     if (selectedFile) {
//       handleFileUploadSubmit();
//     } else if (message.trim() && !isLoading) {
//       // Regular text message
//       onSendMessage(message.trim(), selectedModel);
//       setMessage("");
//     }
//   };

//   const handleFileSelect = (e) => {
//     const file = e.target.files[0];
    
//     if (!file) return;

//     const allowedTypes = [
//       'application/pdf',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'application/msword',
//       'text/plain'
//     ];

//     if (!allowedTypes.includes(file.type)) {
//       alert('Invalid file type. Only PDF, Word documents, and TXT files are allowed.');
//       return;
//     }

//     const maxSize = 10 * 1024 * 1024; // 10MB
//     if (file.size > maxSize) {
//       alert('File is too large. Maximum file size is 10MB.');
//       return;
//     }

//     setSelectedFile(file);
//   };

//   const removeFile = () => {
//     setSelectedFile(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const handleFileUploadSubmit = async () => {
//     if (!selectedFile || !activeConversationId) return;

//     // ✅ Store file and message locally before clearing
//     const fileToUpload = selectedFile;
//     const messageToSend = message.trim();

//     // ✅ Clear the form IMMEDIATELY (before upload starts)
//     setMessage("");
//     setSelectedFile(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }

//     try {
//       // ✅ Call the parent's file upload handler with stored values
//       await onFileUpload(fileToUpload, messageToSend);

//     } catch (error) {
//       console.error('File upload error in MessageInput:', error);
//       // Don't restore the file on error - just show error in chat
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
//             title="Attach file"
//             disabled={isLoading}
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
//             disabled={isLoading}
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
//             placeholder={selectedFile ? `Add a message about ${selectedFile.name}...` : "Type your legal question here..."}
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
//             whileHover={{ scale: isLoading || (!message.trim() && !selectedFile) ? 1 : 1.05 }}
//             whileTap={{ scale: isLoading || (!message.trim() && !selectedFile) ? 1 : 0.95 }}
//             type="submit"
//             disabled={(!message.trim() && !selectedFile) || isLoading}
//             className={`absolute right-2 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
//               (!message.trim() && !selectedFile) || isLoading
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
//             accept=".pdf,.doc,.docx,.txt"
//             onChange={handleFileSelect}
//             className="hidden"
//           />

//           {/* Model Selector Dropdown */}
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
//           {selectedFile && (
//             <motion.div
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
//             >
//               <div className="flex items-center justify-between mb-2">
//                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                   Selected File
//                 </span>
//                 <button
//                   type="button"
//                   onClick={removeFile}
//                   className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-1"
//                 >
//                   <X className="w-3 h-3" />
//                   Remove
//                 </button>
//               </div>
//               <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-md">
//                 <div className="flex items-center space-x-2">
//                   <span className="text-xs text-gray-500 dark:text-gray-400">
//                     📄
//                   </span>
//                   <span className="text-sm text-gray-900 dark:text-white truncate">
//                     {selectedFile.name}
//                   </span>
//                   <span className="text-xs text-gray-500 dark:text-gray-400">
//                     ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
//                   </span>
//                 </div>
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
import { Paperclip, X, Upload } from "lucide-react";

const MessageInput = ({ 
  onSendMessage, 
  isLoading, 
  selectedModel, 
  onModelChange, 
  onFileUpload,
  activeConversationId
}) => {
  const [message, setMessage] = useState("");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileMetadata, setUploadedFileMetadata] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
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
    
    if ((message.trim() || uploadedFileMetadata) && !isLoading && !isUploading) {
      // Send message with file metadata if available
      if (uploadedFileMetadata) {
        onFileUpload(null, message.trim(), uploadedFileMetadata);
      } else {
        onSendMessage(message.trim(), selectedModel);
      }
      
      // Clear form
      setMessage("");
      setSelectedFile(null);
      setUploadedFileMetadata(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    
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
    
    // Upload immediately
    await uploadFileImmediately(file);
  };

  const uploadFileImmediately = async (file) => {
    if (!file || !activeConversationId) return;

    setIsUploading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Uploading file immediately:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Upload file to get extracted text and metadata
      const res = await fetch('http://localhost:5001/api/files/upload-only', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status ${res.status}`);
      }
      
      const data = await res.json();
      console.log('✅ File uploaded, metadata received:', data);
      
      // Store the file metadata (including extracted text)
      setUploadedFileMetadata({
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        extractedText: data.extractedText,
        uploadedAt: new Date().toISOString()
      });

      console.log('✅ File ready for sending with message');
      
    } catch (error) {
      console.error('❌ File upload error:', error);
      alert(`Failed to upload file: ${error.message}`);
      removeFile();
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadedFileMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            disabled={isLoading || isUploading}
          >
            {isUploading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full"
              />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </motion.button>

          {/* Model Selector Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModelSelector((prev) => !prev)}
            className="absolute left-12 flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            disabled={isLoading || isUploading}
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
            placeholder={
              isUploading 
                ? "Uploading file..." 
                : uploadedFileMetadata 
                  ? `Add a message about ${uploadedFileMetadata.fileName}...` 
                  : "Type your legal question here..."
            }
            disabled={isLoading || isUploading}
            className="w-full px-20 py-3 pr-12 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none overflow-hidden"
            rows="1"
            style={{
              minHeight: "44px",
              maxHeight: "none",
            }}
          />

          {/* Send Button */}
          <motion.button
            whileHover={{
              scale:
                (isLoading || isUploading || (!message.trim() && !uploadedFileMetadata))
                  ? 1
                  : 1.05,
            }}
            whileTap={{
              scale:
                (isLoading || isUploading || (!message.trim() && !uploadedFileMetadata))
                  ? 1
                  : 0.95,
            }}
            type="submit"
            disabled={
              (!message.trim() && !uploadedFileMetadata) || isLoading || isUploading
            }
            className={`absolute right-2 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
              (!message.trim() && !uploadedFileMetadata) || isLoading || isUploading
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
          {(selectedFile || uploadedFileMetadata) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  {isUploading ? (
                    <>
                      <Upload className="w-4 h-4 animate-pulse" />
                      Uploading...
                    </>
                  ) : uploadedFileMetadata ? (
                    <>
                      <span className="text-green-500">✓</span>
                      File Ready
                    </>
                  ) : (
                    "Selected File"
                  )}
                </span>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={removeFile}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Remove
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-md">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    📄
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white truncate">
                    {selectedFile?.name || uploadedFileMetadata?.fileName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({((selectedFile?.size || uploadedFileMetadata?.fileSize) / 1024 / 1024).toFixed(2)} MB)
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