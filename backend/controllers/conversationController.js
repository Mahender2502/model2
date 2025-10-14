import ChatSession from "../models/ChatSession.js";
import User from "../models/User.js";

// Send message and store in MongoDB
export const handleMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, sessionId } = req.body;

    let session;

    if (sessionId && sessionId !== "null" && sessionId !== "undefined") {
      // Find existing session
      session = await ChatSession.findOne({
        _id: sessionId,
        userId: userId
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
    } else {
      // Create new session if none exists
      session = new ChatSession({
        userId: userId,
        title: message ? message.substring(0, 30) + (message.length > 30 ? "..." : "") : "New Chat"
      });

      // Increment user's totalChats count when a new chat is created
      try {
        await User.findByIdAndUpdate(userId, { $inc: { totalChats: 1 } });
        console.log(`📊 User ${userId} totalChats incremented for new session`);
      } catch (countError) {
        console.error(`❌ Error incrementing totalChats for user ${userId}:`, countError);
        // Don't fail session creation if updating totalChats fails
      }
    }

    let botReply = "";

    // Add user message
    if (message && message.trim() !== "") {
      session.messages.push({
        sender: "user",
        message: message.trim(),
        timestamp: new Date()
      });

      // Generate bot response (replace with your actual AI integration)
      botReply = await generateBotResponse(message);

      session.messages.push({
        sender: "bot",
        message: botReply,
        timestamp: new Date()
      });

      // Update session title based on first message if not set
      if (!session.title || session.title === "New Chat") {
        session.title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
      }
    }

    await session.save();

    res.status(200).json({
      session: {
        _id: session._id,
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      },
      botReply: botReply
    });
  } catch (error) {
    console.error("❌ handleMessage Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Enhanced bot response generator with legal context
// const generateBotResponse = async (message) => {
//   try {
//     const response = await fetch("http://localhost:5001/generate", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ query: message })
//     });

//     if (!response.ok) {
//       throw new Error(`Flask server error: ${response.statusText}`);
//     }

//     const data = await response.json();
//     return data.response || "⚠️ No response from AI model.";
//   } catch (error) {
//     console.error("❌ generateBotResponse Error:", error);
//     return "⚠️ Sorry, I could not process your request right now.";
//   }
// };

// const generateBotResponse = async (message) => {
//   try {
//     const response = await fetch(
//       "https://noncasuistical-overgenerously-linwood.ngrok-free.dev/generate",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ query: message })
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Flask server error: ${response.statusText}`);
//     }

//     const data = await response.json();
//     return data.response || "⚠️ No response from AI model.";
//   } catch (error) {
//     console.error("❌ generateBotResponse Error:", error);
//     return "⚠️ Sorry, I could not process your request right now.";
//   }
// };

const generateBotResponse = async (message) => {
  try {
    // Your ngrok URL - update this when you get a new URL
    const API_URL = "https://consequential-wettable-danika.ngrok-free.dev/generate";
    
    console.log("🔄 Sending request to:", API_URL);
    console.log("📤 Message:", message);
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"  // Skip ngrok warning page
      },
      body: JSON.stringify({ query: message })
    });

    console.log("📥 Response status:", response.status);
    console.log("📥 Response OK:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Data received:", data);
    
    if (!data.response) {
      throw new Error("No response from AI model");
    }
    
    return data.response;
    
  } catch (error) {
    console.error("❌ generateBotResponse Error:", error);
    
    // More specific error messages
    if (error.message.includes("Failed to fetch")) {
      return "⚠️ Cannot connect to AI server. Please check if the server is running.";
    }
    
    return `⚠️ Sorry, I could not process your request: ${error.message}`;
  }
};



// Fetch all sessions for the user
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

    console.log(`🗑️  Attempting to delete session ${id} for user ${userId}`);

    const result = await ChatSession.findOneAndDelete({
      _id: id,
      userId: userId
    });

    if (!result) {
      console.log(`❌ Session ${id} not found for user ${userId}`);
      return res.status(404).json({ error: "Session not found" });
    }

    console.log(`✅ Session ${id} deleted successfully`);

    // Decrement user's totalChats count if it's greater than 0
    try {
      // First get current count
      const user = await User.findById(userId);
      const currentCount = user ? user.totalChats : 0;
      const newCount = Math.max(0, currentCount - 1);

      await User.findByIdAndUpdate(userId, {
        $set: { totalChats: newCount }
      });

      console.log(`📊 User ${userId} totalChats updated: ${currentCount} -> ${newCount}`);
    } catch (updateError) {
      console.error(`❌ Error updating user totalChats for user ${userId}:`, updateError);
      // Don't fail the deletion if updating totalChats fails
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
      console.log(`📊 User ${userId} totalChats incremented for explicit new session`);
    } catch (countError) {
      console.error(`❌ Error incrementing totalChats for user ${userId}:`, countError);
      // Don't fail session creation if updating totalChats fails
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

