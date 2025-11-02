import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { 
    type: String, 
    enum: ["user", "bot"], 
    required: true 
  },
  message: { 
    type: String, 
    required: false 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  // File metadata (stored for messages with attachments)
  fileMetadata: {
    fileName: { type: String },
    fileType: { type: String, enum: ['pdf', 'docx', 'txt', 'doc'] },
    fileSize: { type: Number },
    // NEW: Store extracted text for edit scenarios
    // This allows re-using file data when editing messages
    extractedText: { type: String }
  }
}, { _id: true });

const chatSessionSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    conversationId: { 
      type: String, 
      unique: true,
      sparse: true
    },
    title: { 
      type: String, 
      default: "New Legal Session" 
    },
    messages: [messageSchema]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Generate a unique conversation ID before saving if not exists
chatSessionSchema.pre("save", function(next) {
  if (!this.conversationId) {
    this.conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Add indexes for better query performance
chatSessionSchema.index({ userId: 1, updatedAt: -1 });
chatSessionSchema.index({ conversationId: 1 });

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
export default ChatSession;