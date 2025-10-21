import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fileValidationService from './fileValidationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileStorageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB

    this.ensureUploadDirectory();
  }

  ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  validateFile(file) {
    // Use the validation service for comprehensive validation
    const validation = fileValidationService.validateFile(file);

    if (!validation.valid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    // Additional specific validations based on file type
    if (file.mimetype === 'application/pdf') {
      const pdfValidation = fileValidationService.validatePDFFile(file.path);
      if (!pdfValidation.valid) {
        throw new Error(`PDF validation failed: ${pdfValidation.reason}`);
      }
    }

    if (file.mimetype.startsWith('image/')) {
      const imageValidation = fileValidationService.validateImageFile(file.path);
      if (!imageValidation.valid) {
        throw new Error(`Image validation failed: ${imageValidation.reason}`);
      }
    }

    return validation;
  }

  generateUniqueFilename(originalName) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    return `file-${timestamp}-${random}${ext}`;
  }

  async saveFile(file) {
    try {
      this.validateFile(file);

      const filename = this.generateUniqueFilename(file.originalname);
      const filepath = path.join(this.uploadDir, filename);

      // Move file from temp location to permanent location
      await fs.promises.rename(file.path, filepath);

      return {
        originalName: file.originalname,
        filename: filename,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${filename}`,
        path: filepath,
        uploadedAt: new Date()
      };
    } catch (error) {
      // Clean up temp file if save fails
      if (file.path && fs.existsSync(file.path)) {
        await fs.promises.unlink(file.path);
      }
      throw error;
    }
  }

  async saveMultipleFiles(files) {
    const savedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        const savedFile = await this.saveFile(file);
        savedFiles.push(savedFile);
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    return {
      savedFiles,
      errors,
      successCount: savedFiles.length,
      errorCount: errors.length
    };
  }

  async deleteFile(filename) {
    try {
      const filepath = path.join(this.uploadDir, filename);

      if (!fs.existsSync(filepath)) {
        throw new Error('File not found');
      }

      await fs.promises.unlink(filepath);
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getFileStream(filename) {
    try {
      const filepath = path.join(this.uploadDir, filename);

      if (!fs.existsSync(filepath)) {
        throw new Error('File not found');
      }

      return fs.createReadStream(filepath);
    } catch (error) {
      throw new Error(`Failed to get file stream: ${error.message}`);
    }
  }

  getFileInfo(filename) {
    try {
      const filepath = path.join(this.uploadDir, filename);

      if (!fs.existsSync(filepath)) {
        throw new Error('File not found');
      }

      const stats = fs.statSync(filepath);
      const ext = path.extname(filename);

      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        extension: ext,
        path: filepath
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  // Clean up old files (optional maintenance function)
  async cleanupOldFiles(daysOld = 30) {
    try {
      const files = fs.readdirSync(this.uploadDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filepath);

        if (stats.mtime < cutoffDate) {
          await fs.promises.unlink(filepath);
          deletedCount++;
        }
      }

      return {
        success: true,
        deletedCount,
        message: `Cleaned up ${deletedCount} old files`
      };
    } catch (error) {
      throw new Error(`Failed to cleanup old files: ${error.message}`);
    }
  }
}

export default new FileStorageService();
