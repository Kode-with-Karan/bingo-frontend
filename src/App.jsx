import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io.connect("https://bingo-server-bvpo.onrender.com");

const WINNING_LINES = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
];

function App() {
  const [activeTab, setActiveTab] = useState("create");
  const [roomInput, setRoomInput] = useState("");
  
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [board, setBoard] = useState(Array(25).fill(null));
  const [markedNumbers, setMarkedNumbers] = useState([]);
  
  const [phase, setPhase] = useState("setup"); 
  const [nextNum, setNextNum] = useState(1);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameResult, setGameResult] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // FIX: Use Ref to track game end instantly to prevent race conditions
  const gameEnded = useRef(false);

  useEffect(() => {
    // 1. Room Logic
    socket.on("room_created", ({ room, isHost }) => {
      setJoined(true);
      setIsHost(true);
      setRoomInput(room);
    });

    socket.on("room_joined", ({ room, isHost }) => {
      setJoined(true);
      setIsHost(false);
      setRoomInput(room);
    });

    socket.on("error_message", (msg) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 3000);
    });

    // 2. Setup Logic
    socket.on("host_can_start", () => setPhase("host_ready_start"));
    socket.on("waiting_for_host", () => setPhase("waiting_host_click"));

    // 3. Game Logic
    socket.on("game_start", (data) => {
      setPhase("playing");
      setIsMyTurn(data.startTurn === socket.id);
      gameEnded.current = false; // Reset for new game
    });

    socket.on("receive_move", (data) => {
      setMarkedNumbers((prev) => [...prev, data.number]);
      setIsMyTurn(data.nextTurn === socket.id);
    });

    // FIX: Handle Opponent Win
    socket.on("opponent_won", () => {
      // If I already marked myself as winner, ignore this (It's a Draw or I was faster)
      if (gameEnded.current) return;

      gameEnded.current = true;
      setGameResult("You Lost 😢");
      setPhase("finished");
    });

    return () => {
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("error_message");
      socket.off("host_can_start");
      socket.off("waiting_for_host");
      socket.off("game_start");
      socket.off("receive_move");
      socket.off("opponent_won");
    };
  }, []);

  // FIX: Check for Local Win
  useEffect(() => {
    if (phase === "playing" && !gameEnded.current) {
      const score = calculateScore(board, markedNumbers);
      
      if (score >= 5) {
        gameEnded.current = true; // Mark as ended immediately
        setGameResult("You Won! 🎉");
        setPhase("finished");
        socket.emit("game_won", { room: roomInput });
      }
    }
  }, [markedNumbers, board, phase, roomInput]);

  // --- Helper Functions ---
  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomInput(result);
  };

  const createRoom = () => {
    if (roomInput.trim() === "") return;
    socket.emit("create_room", roomInput);
  };

  const joinRoom = () => {
    if (roomInput.trim() === "") return;
    socket.emit("join_room", roomInput);
  };

  const handleManualFill = (index) => {
    if (phase !== "setup") return;
    if (board[index] !== null || nextNum > 25) return;
    const newBoard = [...board];
    newBoard[index] = nextNum;
    setBoard(newBoard);
    setNextNum(nextNum + 1);
  };

  const autoFill = () => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    setBoard(nums);
    setNextNum(26);
  };

  const markReady = () => {
    if (nextNum > 25) {
      setPhase("waiting_others");
      socket.emit("player_ready", roomInput);
    }
  };

  const requestStartGame = () => {
    socket.emit("request_start_game", roomInput);
  };

  const handleGameClick = (number) => {
    if (phase !== "playing") return;
    if (!isMyTurn) return;
    if (markedNumbers.includes(number)) return;
    socket.emit("send_move", { room: roomInput, number });
  };

  const calculateScore = (currentBoard, marked) => {
    let lines = 0;
    WINNING_LINES.forEach((lineIndices) => {
      if (lineIndices.every((index) => marked.includes(currentBoard[index]))) {
        lines++;
      }
    });
    return lines;
  };

  // --- Render ---
  if (!joined) {
    return (
      <div className="container">
        <div className="game-card lobby-card">
          <h1>Bingo 🎲</h1>
          <div className="tabs">
            <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>Create Room</button>
            <button className={activeTab === 'join' ? 'active' : ''} onClick={() => setActiveTab('join')}>Join Room</button>
          </div>

          <div className="lobby-content">
            {activeTab === 'create' ? (
              <>
                <p>Create a code or generate one:</p>
                <div className="input-group">
                  <input type="text" value={roomInput} placeholder="Enter Code..." onChange={(e) => setRoomInput(e.target.value.toUpperCase())} />
                  <button className="secondary" onClick={generateCode}>Generate</button>
                </div>
                <button onClick={createRoom} className="primary-btn">Create Room</button>
              </>
            ) : (
              <>
                <p>Enter the Room Code to join:</p>
                <div className="input-group">
                  <input type="text" placeholder="Enter Code..." onChange={(e) => setRoomInput(e.target.value.toUpperCase())} />
                </div>
                <button onClick={joinRoom} className="primary-btn">Join Room</button>
              </>
            )}
            {errorMessage && <div className="error">{errorMessage}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={`game-card ${isMyTurn && phase === 'playing' ? "my-turn" : ""}`}>
        
        <div className="header">
          <span className="room-badge">Code: {roomInput}</span>
          <span className="role-badge">{isHost ? "👑 Host" : "👤 Player"}</span>
          {phase === "playing" && (
            <div className="score-board">{calculateScore(board, markedNumbers)} / 5 Lines</div>
          )}
        </div>

        {phase === "setup" && (
          <div className="status-bar setup">
            <p>Fill your grid ({nextNum <= 25 ? nextNum : "Done"})</p>
            <button className="secondary" onClick={autoFill} style={{marginRight: 10}}>Auto Fill</button>
            <button onClick={markReady} disabled={nextNum <= 25}>Ready</button>
          </div>
        )}

        {phase === "waiting_others" && (
          <div className="status-bar setup">⏳ Waiting for opponent to get Ready...</div>
        )}

        {phase === "host_ready_start" && (
          <div className="status-bar start-zone">
            <p>Both players are Ready!</p>
            <button className="start-btn" onClick={requestStartGame}>START GAME 🚀</button>
          </div>
        )}

        {phase === "waiting_host_click" && (
          <div className="status-bar setup">👀 Waiting for Host to start the game...</div>
        )}

        {phase === "playing" && (
          <div className={`status-bar ${isMyTurn ? "your-turn" : "opponent-turn"}`}>
            {isMyTurn ? "👉 Your Turn" : "⏳ Opponent's Turn"}
          </div>
        )}

        <div className={`grid ${phase === "playing" && !isMyTurn ? "disabled" : ""}`}>
          {board.map((num, index) => {
            const isMarked = num && markedNumbers.includes(num);
            return (
              <div
                key={index}
                className={`cell ${isMarked ? "marked" : ""} ${num === null ? "empty" : ""}`}
                onClick={() => {
                  if (phase === "setup") handleManualFill(index);
                  if (phase === "playing") handleGameClick(num);
                }}
              >
                {num}
              </div>
            );
          })}
        </div>
      </div>

      {phase === "finished" && (
        <div className="overlay">
          <h1>{gameResult}</h1>
          <button onClick={() => window.location.reload()}>New Game</button>
        </div>
      )}
    </div>
  );
}

export default App;