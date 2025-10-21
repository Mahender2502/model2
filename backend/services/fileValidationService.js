import fs from 'fs';
import path from 'path';

class FileValidationService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = {
      'application/pdf': {
        extensions: ['.pdf'],
        maxSize: 10 * 1024 * 1024, // 10MB for PDFs
        description: 'PDF Document'
      },
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        extensions: ['.docx'],
        maxSize: 5 * 1024 * 1024, // 5MB for Word docs
        description: 'Word Document (DOCX)'
      },
      'application/msword': {
        extensions: ['.doc'],
        maxSize: 5 * 1024 * 1024, // 5MB for Word docs
        description: 'Word Document (DOC)'
      },
      'image/jpeg': {
        extensions: ['.jpg', '.jpeg'],
        maxSize: 5 * 1024 * 1024, // 5MB for images
        description: 'JPEG Image'
      },
      'image/png': {
        extensions: ['.png'],
        maxSize: 5 * 1024 * 1024, // 5MB for images
        description: 'PNG Image'
      },
      'image/gif': {
        extensions: ['.gif'],
        maxSize: 5 * 1024 * 1024, // 5MB for images
        description: 'GIF Image'
      },
      'image/webp': {
        extensions: ['.webp'],
        maxSize: 5 * 1024 * 1024, // 5MB for images
        description: 'WebP Image'
      }
    };

    this.suspiciousPatterns = [
      // Basic virus/malware patterns (very basic check)
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i
    ];
  }

  validateFile(file) {
    const errors = [];
    const warnings = [];

    // Basic file validation
    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors, warnings };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Check file type
    const fileTypeInfo = this.allowedTypes[file.mimetype];
    if (!fileTypeInfo) {
      errors.push(`Invalid file type: ${file.mimetype}. Allowed types: ${Object.values(this.allowedTypes).map(t => t.description).join(', ')}`);
    } else {
      // Check specific size limits for file type
      if (file.size > fileTypeInfo.maxSize) {
        errors.push(`File too large for type ${fileTypeInfo.description}: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: ${fileTypeInfo.maxSize / 1024 / 1024}MB`);
      }
    }

    // Check filename
    if (!file.originalname || file.originalname.length === 0) {
      errors.push('Invalid filename');
    } else {
      // Check for suspicious characters in filename
      if (/[<>\"'|?*]/.test(file.originalname)) {
        warnings.push('Filename contains special characters that may cause issues');
      }

      // Check file extension matches MIME type
      const extension = path.extname(file.originalname).toLowerCase();
      if (fileTypeInfo && !fileTypeInfo.extensions.includes(extension)) {
        warnings.push(`File extension ${extension} doesn't match MIME type ${file.mimetype}`);
      }
    }

    // Basic security check for text-based files
    if (file.mimetype.startsWith('text/') || file.mimetype.includes('document')) {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        const securityCheck = this.performSecurityCheck(content);
        if (!securityCheck.safe) {
          errors.push(`File contains potentially malicious content: ${securityCheck.reason}`);
        }
      } catch (error) {
        // If we can't read the file, add a warning
        warnings.push('Could not perform security check on file content');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      fileType: fileTypeInfo ? fileTypeInfo.description : 'Unknown'
    };
  }

  validateMultipleFiles(files) {
    const results = files.map(file => ({
      filename: file.originalname,
      ...this.validateFile(file)
    }));

    const validFiles = results.filter(r => r.valid);
    const invalidFiles = results.filter(r => !r.valid);

    return {
      valid: invalidFiles.length === 0,
      results,
      validFiles,
      invalidFiles,
      summary: {
        total: files.length,
        valid: validFiles.length,
        invalid: invalidFiles.length,
        warnings: results.filter(r => r.warnings.length > 0).length
      }
    };
  }

  performSecurityCheck(content) {
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        return {
          safe: false,
          reason: `Suspicious pattern detected: ${pattern.source}`
        };
      }
    }

    return { safe: true };
  }

  // Advanced validation for PDF files
  validatePDFFile(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);

      // Check PDF header
      const header = buffer.subarray(0, 8).toString();
      if (!header.startsWith('%PDF-')) {
        return { valid: false, reason: 'Invalid PDF header' };
      }

      // Check for PDF trailer
      const trailer = buffer.subarray(-1024).toString();
      if (!trailer.includes('%%EOF')) {
        return { valid: false, reason: 'PDF file appears to be corrupted (no EOF marker)' };
      }

      // Basic size check for reasonable PDF structure
      if (buffer.length < 100) {
        return { valid: false, reason: 'PDF file too small to be valid' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: `Error reading PDF file: ${error.message}` };
    }
  }

  // Advanced validation for image files
  validateImageFile(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);

      // Check for common image headers
      const imageHeaders = {
        jpeg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
        gif: [0x47, 0x49, 0x46],
        webp: [0x52, 0x49, 0x46, 0x46] // RIFF header for WebP
      };

      const headerBytes = Array.from(buffer.subarray(0, 12));

      let isValidImage = false;
      for (const [type, header] of Object.entries(imageHeaders)) {
        if (header.every((byte, index) => byte === headerBytes[index])) {
          isValidImage = true;
          break;
        }
      }

      if (!isValidImage) {
        return { valid: false, reason: 'Invalid image file format' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: `Error reading image file: ${error.message}` };
    }
  }

  // Get file type information
  getFileTypeInfo(mimetype) {
    return this.allowedTypes[mimetype] || null;
  }

  // Check if file type is allowed
  isFileTypeAllowed(mimetype) {
    return !!this.allowedTypes[mimetype];
  }

  // Get all supported file types
  getSupportedTypes() {
    return Object.entries(this.allowedTypes).map(([mimetype, info]) => ({
      mimetype,
      ...info
    }));
  }
}

export default new FileValidationService();
