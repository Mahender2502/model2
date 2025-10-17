import ChatSession from "../models/ChatSession.js";
import User from "../models/User.js";

// Save conversation from Flask server
export const saveConversation = async (req, res) => {
  try {
    const { userId, sessionId, userMessage, botMessage, model } = req.body;

    console.log(`💾 saveConversation called with:`, {
      userId,
      sessionId,
      userMessage: userMessage?.substring(0, 50) + (userMessage?.length > 50 ? '...' : ''),
      botMessage: botMessage?.substring(0, 50) + (botMessage?.length > 50 ? '...' : ''),
      model,
      user: req.user ? req.user.id : 'No user in token'
    });

    if (!userId || !userMessage || !botMessage) {
      console.log(`❌ Missing required fields: userId=${userId}, userMessage=${userMessage}, botMessage=${botMessage}`);
      return res.status(400).json({ error: "Missing required fields" });
    }

    let session;

    // Check if session exists
    if (sessionId && sessionId !== "null" && sessionId !== "undefined") {
      session = await ChatSession.findOne({
        _id: sessionId,
        userId: userId
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
    } else {
      // Create new session
      const title = userMessage.substring(0, 30) + (userMessage.length > 30 ? "..." : "");
      session = new ChatSession({
        userId: userId,
        title: title,
        messages: []
      });

      // Increment user's totalChats count
      try {
        await User.findByIdAndUpdate(userId, { $inc: { totalChats: 1 } });
        console.log(`📊 User ${userId} totalChats incremented`);
      } catch (countError) {
        console.error(`❌ Error incrementing totalChats:`, countError);
      }
    }

    // Add user message
    session.messages.push({
      sender: "user",
      message: userMessage.trim(),
      timestamp: new Date()
    });

    // Add bot message
    session.messages.push({
      sender: "bot",
      message: botMessage,
      timestamp: new Date()
    });

    await session.save();

    console.log(`✅ Conversation saved to session ${session._id}`);

    res.status(200).json({
      session: {
        _id: session._id,
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    console.error("❌ saveConversation Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all sessions for user
export const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await ChatSession.find({ userId: userId })
      .sort({ updatedAt: -1 })
      .select("-__v")
      .lean();

    res.status(200).json(sessions);
  } catch (error) {
    console.error("❌ getUserSessions Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a session
export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`🗑️ Attempting to delete session ${id} for user ${userId}`);

    const result = await ChatSession.findOneAndDelete({
      _id: id,
      userId: userId
    });

    if (!result) {
      console.log(`❌ Session ${id} not found for user ${userId}`);
      return res.status(404).json({ error: "Session not found" });
    }

    console.log(`✅ Session ${id} deleted successfully`);

    // Decrement user's totalChats count
    try {
      const user = await User.findById(userId);
      const currentCount = user ? user.totalChats : 0;
      const newCount = Math.max(0, currentCount - 1);

      await User.findByIdAndUpdate(userId, {
        $set: { totalChats: newCount }
      });

      console.log(`📊 User ${userId} totalChats updated: ${currentCount} -> ${newCount}`);
    } catch (updateError) {
      console.error(`❌ Error updating user totalChats:`, updateError);
    }

    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("❌ deleteSession Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new session explicitly
export const createNewSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    const session = new ChatSession({
      userId: userId,
      title: title || "New Legal Consultation",
      messages: [
        {
          sender: "bot",
          message: "Hello! I'm LAWGPT, your AI legal assistant. How can I help you with legal questions today?",
          timestamp: new Date()
        }
      ]
    });

    await session.save();

    // Increment user's totalChats count
    try {
      await User.findByIdAndUpdate(userId, { $inc: { totalChats: 1 } });
      console.log(`📊 User ${userId} totalChats incremented for new session`);
    } catch (countError) {
      console.error(`❌ Error incrementing totalChats:`, countError);
    }

    res.status(201).json({
      _id: session._id,
      title: session.title,
      messages: session.messages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (error) {
    console.error("❌ createNewSession Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update session title
export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    console.log(`✏️ Attempting to update session ${id} title to '${title}'`);

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const session = await ChatSession.findOne({
      _id: id,
      userId: userId
    });

    if (!session) {
      console.log(`❌ Session ${id} not found for user ${userId}`);
      return res.status(404).json({ error: 'Session not found' });
    }

    session.title = title.trim();
    session.updatedAt = new Date();

    await session.save();

    console.log(`✅ Session ${id} title updated successfully to '${title}'`);

    res.status(200).json({
      _id: session._id,
      title: session.title,
      updatedAt: session.updatedAt
    });
  } catch (error) {
    console.error('❌ updateSession Error:', error);
    res.status(500).json({ error: error.message });
  }
};