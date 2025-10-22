import { motion } from 'framer-motion';
import { Download, FileText, Image as ImageIcon, X } from 'lucide-react';

const FilePreview = ({ file, onRemove, className = "" }) => {
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    }
    if (fileType === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    if (fileType.includes('document') || fileType.includes('word')) {
      return <FileText className="w-8 h-8 text-blue-600" />;
    }
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const getFileTypeLabel = (fileType) => {
    if (fileType.startsWith('image/')) {
      return 'Image';
    }
    if (fileType === 'application/pdf') {
      return 'PDF Document';
    }
    if (fileType.includes('document') || fileType.includes('word')) {
      return 'Word Document';
    }
    return 'File';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    // Create download link
    const link = document.createElement('a');
    link.href = file.url || file.data;
    link.download = file.name || file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 ${className}`}
    >
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start space-x-3">
        {/* File icon */}
        <div className="flex-shrink-0">
          {file.url || file.data ? (
            file.type?.startsWith('image/') ? (
              <img
                src={file.url || file.data}
                alt={file.name || file.originalName}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                {getFileIcon(file.type)}
              </div>
            )
          ) : (
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
              {getFileIcon(file.type)}
            </div>
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {file.name || file.originalName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getFileTypeLabel(file.type)} • {formatFileSize(file.size)}
          </p>

          {/* Download button for uploaded files */}
          {(file.url || file.data) && (
            <button
              onClick={handleDownload}
              className="mt-2 inline-flex items-center px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FilePreview;
