import ChatSession from "../models/ChatSession.js";
import User from "../models/User.js";

// Save conversation from Flask server
export const saveConversation = async (req, res) => {
  try {
    const { userId, sessionId, userMessage, botMessage, model, isEdit, fileMetadata } = req.body;

    console.log(`💾 saveConversation called with:`, {
      userId,
      sessionId,
      userMessage: userMessage?.substring(0, 50) + (userMessage?.length > 50 ? "..." : ""),
      botMessage: botMessage?.substring(0, 50) + (botMessage?.length > 50 ? "..." : ""),
      model,
      isEdit,
      hasFile: !!fileMetadata,
      fileMetadata: fileMetadata,
      user: req.user ? req.user.id : "No user in token",
    });

    if (!userId || !userMessage || !botMessage) {
      console.log(`❌ Missing required fields`);
      return res.status(400).json({ error: "Missing required fields" });
    }

    let session;

    // Check if session exists
    if (sessionId && sessionId !== "null" && sessionId !== "undefined") {
      session = await ChatSession.findOne({
        _id: sessionId,
        userId: userId,
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
    } else {
      // Create new session
      const title =
        userMessage.substring(0, 30) + (userMessage.length > 30 ? "..." : "");
      session = new ChatSession({
        userId: userId,
        title: title,
        messages: [],
      });

      // Increment user's totalChats count
      try {
        await User.findByIdAndUpdate(userId, { $inc: { totalChats: 1 } });
        console.log(`📊 User ${userId} totalChats incremented`);
      } catch (countError) {
        console.error(`❌ Error incrementing totalChats:`, countError);
      }
    }

    // If this is an edit, only add bot message (user message already exists)
    if (isEdit) {
      console.log(`✏️ Edit mode: Only adding bot response`);
      const botMsgObj = {
        sender: "bot",
        message: botMessage,
        timestamp: new Date(),
      };
      // Only add fileMetadata if it exists
      if (fileMetadata) {
        botMsgObj.fileMetadata = fileMetadata;
      }
      session.messages.push(botMsgObj);
    } else {
      // Normal flow: add both user and bot messages
      console.log(`💬 Normal mode: Adding user and bot messages`);

      const userMsgObj = {
        sender: "user",
        message: userMessage.trim(),
        timestamp: new Date(),
      };
      // Only add fileMetadata to user message if file was uploaded
      if (fileMetadata) {
        userMsgObj.fileMetadata = fileMetadata;
        console.log(`📎 Adding file metadata to user message:`, fileMetadata);
      }

      session.messages.push(userMsgObj);

      const botMsgObj = {
        sender: "bot",
        message: botMessage,
        timestamp: new Date(),
      };
      session.messages.push(botMsgObj);
    }

    // Save session (timestamps enabled)
    await session.save();

    console.log(`✅ Conversation saved to session ${session._id}`);
    console.log(`📝 Total messages in session: ${session.messages.length}`);

    res.status(200).json({
      session: {
        _id: session._id,
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
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
      .sort({ createdAt: 1 })
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
      title: title || "New Legal Session",
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

// Update a specific message and remove all subsequent messages
export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, timestamp } = req.body;
    const userId = req.user.id;

    console.log(`✏️ Attempting to update message ${id} and remove subsequent messages`);

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Find the session that contains this message
    const session = await ChatSession.findOne({
      userId: userId,
      'messages._id': id
    });

    if (!session) {
      console.log(`❌ Message ${id} not found for user ${userId}`);
      return res.status(404).json({ error: 'Message not found' });
    }

    // Find the index of the message to update
    const messageIndex = session.messages.findIndex(msg => msg._id.toString() === id);
    
    if (messageIndex === -1) {
      console.log(`❌ Message ${id} not found in session ${session._id}`);
      return res.status(404).json({ error: 'Message not found' });
    }

    const messageToUpdate = session.messages[messageIndex];

    // Only allow editing user messages
    if (messageToUpdate.sender !== 'user') {
      console.log(`❌ Cannot edit bot message ${id}`);
      return res.status(403).json({ error: 'Only user messages can be edited' });
    }

    // Update the message
    messageToUpdate.message = message.trim();
    if (timestamp) {
      messageToUpdate.timestamp = new Date(timestamp);
    }

    // Remove all messages after this one (ChatGPT behavior)
    session.messages = session.messages.slice(0, messageIndex + 1);
    
    console.log(`🗑️ Removed ${session.messages.length - messageIndex - 1} messages after the edited message`);

    // Update session timestamp
    session.updatedAt = new Date();

    await session.save();

    console.log(`✅ Message ${id} updated successfully and subsequent messages removed`);

    res.status(200).json({
      _id: messageToUpdate._id,
      message: messageToUpdate.message,
      timestamp: messageToUpdate.timestamp,
      sessionId: session._id,
      totalMessages: session.messages.length,
      updatedAt: session.updatedAt
    });
  } catch (error) {
    console.error('❌ updateMessage Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Regenerate bot response for edited message
export const regenerateResponse = async (req, res) => {
  try {
    const { message, sessionId, model } = req.body;
    const userId = req.user.id;

    console.log(`🔄 Regenerating response for message: ${message?.substring(0, 50)}...`);

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }

    // Find the session
    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      console.log(`❌ Session ${sessionId} not found for user ${userId}`);
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update the user message
    const userMessage = session.messages.find(msg => msg.sender === 'user');
    if (!userMessage) {
      console.log(`❌ No user message found in session ${sessionId}`);
      return res.status(404).json({ error: 'No user message found' });
    }

    userMessage.message = message.trim();
    userMessage.timestamp = new Date();

    // Remove any existing bot responses for this conversation
    session.messages = session.messages.filter(msg => msg.sender !== 'bot');

    // Update session timestamp
    session.updatedAt = new Date();

    await session.save();

    console.log(`✅ Message updated and old bot responses removed`);

    // Return the updated session (without bot response - that will come from Flask)
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
    console.error('❌ regenerateResponse Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Save bot response only (for edits/regenerations)
export const saveBotResponseOnly = async (req, res) => {
  try {
    const { userId, sessionId, botMessage, model } = req.body;

    console.log(`💾 saveBotResponseOnly called for session ${sessionId}`);

    if (!userId || !sessionId || !botMessage) {
      console.log(`❌ Missing required fields`);
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Only add bot message (user message already exists from edit)
    session.messages.push({
      sender: "bot",
      message: botMessage,
      timestamp: new Date()
    });

    await session.save({ timestamps: false });

    console.log(`✅ Bot response saved to session ${session._id}`);

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
    console.error("❌ saveBotResponseOnly Error:", error);
    res.status(500).json({ error: error.message });
  }
};