import React from "react";
import { useGame } from "../context/GameContext";

const EMOJI_LIST = ["😂", "😡", "😭", "🎉", "😎", "💩"];

const EmojiReactor = () => {
  const { sendEmoji, floatingEmojis, phase } = useGame();

  if (phase !== "playing") return null;

  return (
    <div className="emoji-container">
      {/* 1. The Floating Animation Area */}
      <div className="floating-area">
        {floatingEmojis.map((item) => (
          <div 
            key={item.id} 
            className="floating-emoji"
            style={{ left: `${Math.random() * 80 + 10}%` }} // Random horizontal position
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* 2. The Reaction Bar */}
      <div className="emoji-bar">
        {EMOJI_LIST.map((emoji) => (
          <button 
            key={emoji} 
            className="emoji-btn" 
            onClick={() => sendEmoji(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiReactor;