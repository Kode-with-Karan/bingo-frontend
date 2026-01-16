import React, { useState } from "react";
import { useGame } from "../context/GameContext";

const GameHeader = () => {
  const { room, isHost, phase, board, markedNumbers, calculateScore, isMyTurn } = useGame();
  const score = calculateScore(board, markedNumbers);
  
  // State to show "Copied!" message temporarily
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(room);
    setCopied(true);
    // Reset back to normal after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  let statusText = "";
  let statusClass = "setup";

  if (phase === "setup") statusText = "Fill your grid";
  else if (phase === "waiting_others") statusText = "⏳ Waiting for opponent...";
  else if (phase === "waiting_host") statusText = "👀 Waiting for Host to start...";
  else if (phase === "host_ready") statusText = "Both Ready! Start Game 🚀";
  else if (phase === "playing") {
    statusText = isMyTurn ? "👉 Your Turn" : "⏳ Opponent's Turn";
    statusClass = isMyTurn ? "your-turn" : "opponent-turn";
  }

  return (
    <>
      <div className="header">
        {/* Clickable Room Badge */}
        <span 
          className="room-badge clickable" 
          onClick={copyToClipboard}
          title="Click to copy"
        >
          {copied ? "✅ Copied!" : `Code: ${room} 📋`}
        </span>
        
        <span className="role-badge">{isHost ? "👑 Host" : "👤 Player"}</span>
        
        {phase === "playing" && <div className="score-board">{score} / 5 Lines</div>}
      </div>

      <div className={`status-bar ${statusClass} ${phase === 'host_ready' ? 'start-zone' : ''}`}>
        {statusText}
      </div>
    </>
  );
};

export default GameHeader;