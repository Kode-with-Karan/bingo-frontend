import React from "react";
import { useGame } from "../context/GameContext";

const WinOverlay = () => {
  const { phase, gameResult, resetGame } = useGame();

  if (phase !== "finished") return null;

  return (
    <div className="overlay">
      <h1>{gameResult}</h1>
      <button onClick={resetGame}>Play Again</button>
    </div>
  );
};

export default WinOverlay;