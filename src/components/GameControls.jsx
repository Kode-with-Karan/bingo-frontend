import React from "react";
import { useGame } from "../context/GameContext";

const GameControls = () => {
  const { phase, nextNum, autoFillBoard, playerReady, startGame } = useGame();

  if (phase === "setup") {
    return (
      <div className="input-group">
        <button className="secondary" onClick={autoFillBoard}>Auto Fill</button>
        <button className="primary-btn" onClick={playerReady} disabled={nextNum <= 25}>
          {nextNum <= 25 ? `Fill ${nextNum}` : "Ready"}
        </button>
      </div>
    );
  }

  if (phase === "host_ready") {
    return (
      <button className="start-btn" onClick={startGame}>START GAME</button>
    );
  }

  return null;
};

export default GameControls;