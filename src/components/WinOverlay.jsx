import React from "react";
import { useGame } from "../context/GameContext";

const WinOverlay = () => {
  const { phase, gameResult, playAgain, resetGame } = useGame();

  if (phase !== "finished") return null;

  return (
    <div className="overlay">
      <h1>{gameResult}</h1>
      
      <div className="overlay-buttons">
        {/* Play Again: Resets room for both players */}
        <button className="primary-btn" onClick={playAgain}>
          🔄 Play Again
        </button>

        {/* Home: Reloads page to go back to Lobby */}
        <button className="secondary" onClick={resetGame} style={{ background: '#fff', color: '#333' }}>
          🏠 Home
        </button>
      </div>
    </div>
  );
};

export default WinOverlay;