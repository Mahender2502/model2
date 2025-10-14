import React from "react";

const ChatWindow = ({ messages }) => {
  return (
    <div className="flex-1 p-4 chat-scroll h-[500px] space-y-2">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`message-bubble ${msg.isUser ? "user-message" : "bot-message"}`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
};

export default ChatWindow;
