import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { authenticateToken } from "./authRoutes.js";
import fileStorageService from "../services/fileStorageService.js";

const router = express.Router();

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads (temp storage only)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use system temp directory for multer
    cb(null, '/tmp');
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word documents, and images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  }
});

// File upload endpoint
router.post("/upload", authenticateToken, upload.array('file-0', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const result = await fileStorageService.saveMultipleFiles(req.files);

    if (result.errorCount > 0) {
      console.warn('Some files failed to upload:', result.errors);
    }

    if (result.successCount === 0) {
      return res.status(400).json({
        message: 'No files were successfully uploaded',
        errors: result.errors
      });
    }

    res.status(200).json({
      message: `${result.successCount} file(s) uploaded successfully`,
      files: result.savedFiles,
      count: result.successCount,
      ...(result.errorCount > 0 && { warnings: result.errors })
    });

  } catch (error) {
    console.error('File upload error:', error);

    // Clean up uploaded files if there's an error
    if (req.files) {
      for (const file of req.files) {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.status(500).json({
      message: 'File upload failed',
      error: error.message
    });
  }
});

// Get uploaded file
router.get("/file/:filename", authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename;

    // Get file info first to validate it exists
    const fileInfo = fileStorageService.getFileInfo(filename);

    const fileStream = fileStorageService.getFileStream(filename);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
    res.setHeader('Content-Length', fileInfo.size);

    fileStream.pipe(res);

  } catch (error) {
    console.error('File retrieval error:', error);

    if (error.message.includes('File not found')) {
      res.status(404).json({ message: 'File not found' });
    } else {
      res.status(500).json({ message: 'Error retrieving file' });
    }
  }
});

// Delete uploaded file
router.delete("/file/:filename", authenticateToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    const result = await fileStorageService.deleteFile(filename);

    res.status(200).json(result);
  } catch (error) {
    console.error('File deletion error:', error);

    if (error.message.includes('File not found')) {
      res.status(404).json({ message: 'File not found' });
    } else {
      res.status(500).json({ message: 'Error deleting file' });
    }
  }
});

export default router;
