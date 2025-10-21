import express from "express";
import { 
  saveConversation, 
  saveBotResponseOnly,  // Add this
  getUserSessions, 
  deleteSession, 
  createNewSession,
  updateSession,
  updateMessage,
  regenerateResponse
} from "../controllers/conversationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a new empty session
router.post("/new", authMiddleware, createNewSession);

// Save conversation from Flask (called by Flask server)
router.post("/save", authMiddleware, saveConversation);

// Save only bot response (for edits/regenerations)
router.post("/save-bot-only", authMiddleware, saveBotResponseOnly);

// Fetch all sessions for authenticated user
router.get("/", authMiddleware, getUserSessions);

// Update session title
router.put("/:id", authMiddleware, updateSession);

// Update a specific message
router.put("/messages/:id", authMiddleware, updateMessage);

// Regenerate bot response for edited message
router.post("/regenerate", authMiddleware, regenerateResponse);

// Delete a specific session
router.delete("/:id", authMiddleware, deleteSession);

export default router;