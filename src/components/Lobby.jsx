import React, { useState } from "react";
import { useGame } from "../context/GameContext";

const Lobby = () => {
  const { createRoom, joinRoom, error } = useGame();
  const [activeTab, setActiveTab] = useState("create");
  const [inputCode, setInputCode] = useState("");

  const handleAction = () => {
    if (!inputCode) return;
    activeTab === "create" ? createRoom(inputCode) : joinRoom(inputCode);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "";
    for (let i = 0; i < 6; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    setInputCode(res);
  };

  return (
    <div className="game-card lobby-card">
      <h1>Bingo 🎲</h1>
      <div className="tabs">
        <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>Create Room</button>
        <button className={activeTab === 'join' ? 'active' : ''} onClick={() => setActiveTab('join')}>Join Room</button>
      </div>

      <div className="input-group">
        <input 
          value={inputCode} 
          onChange={(e) => setInputCode(e.target.value.toUpperCase())} 
          placeholder="ROOM CODE" 
        />
        {activeTab === "create" && <button className="secondary" onClick={generateCode}>Generate</button>}
      </div>

      <button className="primary-btn" onClick={handleAction}>
        {activeTab === "create" ? "Create Room" : "Join Room"}
      </button>
      
      {error && <div className="error-msg" style={{color: 'red', marginTop: 10}}>{error}</div>}
    </div>
  );
};

export default Lobby;