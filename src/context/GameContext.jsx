import React, { createContext, useState, useEffect, useRef, useContext } from "react";
import io from "socket.io-client";

const GameContext = createContext();

// REPLACE WITH YOUR RENDER BACKEND URL
const SOCKET_URL = "https://bingo-server-bvpo.onrender.com"; 
// const SOCKET_URL = "http://localhost:3001"; 
const socket = io.connect(SOCKET_URL);

const WINNING_LINES = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
];

export const GameProvider = ({ children }) => {
  const [room, setRoom] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [phase, setPhase] = useState("setup"); // setup, waiting, playing, finished
  const [board, setBoard] = useState(Array(25).fill(null));
  const [markedNumbers, setMarkedNumbers] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameResult, setGameResult] = useState("");
  const [nextNum, setNextNum] = useState(1);
  const [error, setError] = useState("");
  
  const gameEnded = useRef(false);

  useEffect(() => {
    socket.on("room_created", ({ room, isHost }) => {
      setRoom(room);
      setIsJoined(true);
      setIsHost(isHost);
    });

    socket.on("room_joined", ({ room, isHost }) => {
      setRoom(room);
      setIsJoined(true);
      setIsHost(isHost);
    });

    socket.on("error_message", (msg) => {
      setError(msg);
      setTimeout(() => setError(""), 3000);
    });

    socket.on("host_can_start", () => setPhase("host_ready"));
    socket.on("waiting_for_host", () => setPhase("waiting_host"));

    socket.on("game_start", ({ startTurn }) => {
      setPhase("playing");
      setIsMyTurn(startTurn === socket.id);
      gameEnded.current = false;
    });

    socket.on("receive_move", ({ number, nextTurn }) => {
      setMarkedNumbers((prev) => [...prev, number]);
      setIsMyTurn(nextTurn === socket.id);
    });

    socket.on("opponent_won", () => {
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

  // Check Win Condition
  useEffect(() => {
    if (phase === "playing" && !gameEnded.current) {
      const score = calculateScore(board, markedNumbers);
      if (score >= 5) {
        gameEnded.current = true;
        setGameResult("You Won! 🎉");
        setPhase("finished");
        socket.emit("game_won", { room });
      }
    }
  }, [markedNumbers, board, phase, room]);

  // Actions
  const calculateScore = (currentBoard, marked) => {
    let lines = 0;
    WINNING_LINES.forEach((line) => {
      if (line.every((idx) => marked.includes(currentBoard[idx]))) lines++;
    });
    return lines;
  };

  const createRoom = (code) => socket.emit("create_room", code);
  const joinRoom = (code) => socket.emit("join_room", code);
  
  const autoFillBoard = () => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setBoard(nums);
    setNextNum(26);
  };

  const manualFill = (index) => {
    if (board[index] !== null || nextNum > 25) return;
    const newBoard = [...board];
    newBoard[index] = nextNum;
    setBoard(newBoard);
    setNextNum(nextNum + 1);
  };

  const playerReady = () => {
    setPhase("waiting_others");
    socket.emit("player_ready", room);
  };

  const startGame = () => socket.emit("request_start_game", room);

  const makeMove = (number) => {
    if (!isMyTurn || markedNumbers.includes(number)) return;
    socket.emit("send_move", { room, number });
  };

  const resetGame = () => window.location.reload();

  return (
    <GameContext.Provider
      value={{
        room, isJoined, isHost, phase, board, markedNumbers, isMyTurn, 
        gameResult, nextNum, error, 
        createRoom, joinRoom, autoFillBoard, manualFill, playerReady, 
        startGame, makeMove, resetGame, calculateScore
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);