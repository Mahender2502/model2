import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    userType: { type: String, required: false },
    password: { type: String, required: true },
    chatSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "ChatSession" }],
    totalChats: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);