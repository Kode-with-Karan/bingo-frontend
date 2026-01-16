import React from "react";
import { useGame } from "../context/GameContext";

const GameBoard = () => {
  const { board, markedNumbers, phase, manualFill, makeMove, isMyTurn } = useGame();

  const handleCellClick = (num, index) => {
    if (phase === "setup") manualFill(index);
    if (phase === "playing") makeMove(num);
  };

  const isDisabled = phase === "playing" && !isMyTurn;

  return (
    <div className={`grid ${isDisabled ? "disabled" : ""}`}>
      {board.map((num, index) => {
        const isMarked = num && markedNumbers.includes(num);
        return (
          <div
            key={index}
            className={`cell ${isMarked ? "marked" : ""} ${num === null ? "empty" : ""}`}
            onClick={() => handleCellClick(num, index)}
          >
            {num}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;