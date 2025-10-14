import express from "express";
import ChatSession from "../models/ChatSession.js";

const router = express.Router();

// ✅ Create a new chat session
router.post("/", async (req, res) => {
  try {
    const { userId, title } = req.body;
    const session = await ChatSession.create({ user: userId, title });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: "Error creating chat session", error: err.message });
  }
});

// ✅ Get all chat sessions for a user
router.get("/:userId", async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching sessions", error: err.message });
  }
});

// ✅ Add message to a session
router.post("/:sessionId/messages", async (req, res) => {
  try {
    const { sender, text } = req.body;
    const session = await ChatSession.findByIdAndUpdate(
      req.params.sessionId,
      { $push: { messages: { sender, text } } },
      { new: true }
    );
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: "Error adding message", error: err.message });
  }
});

export default router;
