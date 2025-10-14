import express from "express";
import { 
  handleMessage, 
  getUserSessions, 
  deleteSession, 
  createNewSession 
} from "../controllers/conversationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Debug middleware for this router
router.use((req, res, next) => {
  console.log(`Conversation route: ${req.method} ${req.originalUrl}`);
  next();
});

// IMPORTANT: Put specific routes BEFORE general routes
// Create a new empty session - THIS MUST COME BEFORE the general POST route
router.post("/new", authMiddleware, createNewSession);

// Fetch all sessions for authenticated user
router.get("/", authMiddleware, getUserSessions);

// Send message to existing session or create new one
router.post("/", authMiddleware, handleMessage);

// Delete a specific session
router.delete("/:id", authMiddleware, deleteSession);

export default router;