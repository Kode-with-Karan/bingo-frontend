import React from "react";
import { GameProvider, useGame } from "./context/GameContext";
import Lobby from "./components/Lobby";
import GameHeader from "./components/GameHeader";
import GameBoard from "./components/GameBoard";
import GameControls from "./components/GameControls";
import WinOverlay from "./components/WinOverlay";
import "./App.css";

const GameContainer = () => {
  const { isJoined } = useGame();

  if (!isJoined) return <Lobby />;

  return (
    <div className="game-card">
      <GameHeader />
      <GameBoard />
      <GameControls />
      <WinOverlay />
    </div>
  );
};

function App() {
  return (
    <div className="container">
      <GameProvider>
        <GameContainer />
      </GameProvider>
    </div>
  );
}

export default App;