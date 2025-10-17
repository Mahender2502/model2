import express from "express";
import { 
  saveConversation, 
  getUserSessions, 
  deleteSession, 
  createNewSession,
  updateSession 
} from "../controllers/conversationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a new empty session
router.post("/new", authMiddleware, createNewSession);

// Save conversation from Flask (called by Flask server)
router.post("/save", authMiddleware, saveConversation);

// Fetch all sessions for authenticated user
router.get("/", authMiddleware, getUserSessions);

// Update session title
router.put("/:id", authMiddleware, updateSession);

// Delete a specific session
router.delete("/:id", authMiddleware, deleteSession);

export default router;