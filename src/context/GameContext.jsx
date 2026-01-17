

// import React, { createContext, useState, useEffect, useRef, useContext } from "react";
// import io from "socket.io-client";

// const GameContext = createContext();

// // ⬇️ REPLACE THIS WITH YOUR ACTUAL RENDER URL ⬇️
// // const SOCKET_URL = "http://localhost:3001"; 
// const SOCKET_URL = "https://bingo-server-bvpo.onrender.com"; 

// const socket = io.connect(SOCKET_URL);

// const WINNING_LINES = [
//   [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Horizontal
//   [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Vertical
//   [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonal
// ];

// export const GameProvider = ({ children }) => {
//   // --- STATE ---
//   const [room, setRoom] = useState("");
//   const [isJoined, setIsJoined] = useState(false);
//   const [isHost, setIsHost] = useState(false);
  
//   // Phases: setup -> waiting_others -> waiting_host -> host_ready -> playing -> finished
//   const [phase, setPhase] = useState("setup"); 
  
//   const [board, setBoard] = useState(Array(25).fill(null));
//   const [markedNumbers, setMarkedNumbers] = useState([]);
//   const [isMyTurn, setIsMyTurn] = useState(false);
//   const [gameResult, setGameResult] = useState("");
//   const [nextNum, setNextNum] = useState(1);
//   const [error, setError] = useState("");
  
//   // New State for Emojis
//   const [floatingEmojis, setFloatingEmojis] = useState([]);
  
//   // Refs
//   const gameEnded = useRef(false);

//   // --- SOCKET LISTENERS ---
//   useEffect(() => {
//     // 1. Room Logic
//     socket.on("room_created", ({ room, isHost }) => {
//       setRoom(room);
//       setIsJoined(true);
//       setIsHost(isHost);
//     });

//     socket.on("room_joined", ({ room, isHost }) => {
//       setRoom(room);
//       setIsJoined(true);
//       setIsHost(isHost);
//     });

//     socket.on("error_message", (msg) => {
//       setError(msg);
//       setTimeout(() => setError(""), 3000);
//     });

//     // 2. Setup Phase Logic
//     socket.on("host_can_start", () => setPhase("host_ready"));
//     socket.on("waiting_for_host", () => setPhase("waiting_host"));

//     // 3. Game Logic
//     socket.on("game_start", ({ startTurn }) => {
//       setPhase("playing");
//       setIsMyTurn(startTurn === socket.id);
//       gameEnded.current = false;
//     });

//     socket.on("receive_move", ({ number, nextTurn }) => {
//       setMarkedNumbers((prev) => [...prev, number]);
//       setIsMyTurn(nextTurn === socket.id);
//     });

//     socket.on("opponent_won", () => {
//       if (gameEnded.current) return;
//       gameEnded.current = true;
//       setGameResult("You Lost 😢");
//       setPhase("finished");
//     });

//     // 4. Emoji Logic (NEW)
//     socket.on("receive_emoji", (emoji) => {
//       const id = Date.now() + Math.random();
//       // Add emoji to state to trigger animation
//       setFloatingEmojis((prev) => [...prev, { id, emoji }]);

//       // Remove it from DOM after animation finishes (2 seconds)
//       setTimeout(() => {
//         setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
//       }, 2000);
//     });

//     return () => {
//       socket.off("room_created");
//       socket.off("room_joined");
//       socket.off("error_message");
//       socket.off("host_can_start");
//       socket.off("waiting_for_host");
//       socket.off("game_start");
//       socket.off("receive_move");
//       socket.off("opponent_won");
//       socket.off("receive_emoji");
//     };
//   }, []);

//   // --- CHECK WIN CONDITION ---
//   useEffect(() => {
//     if (phase === "playing" && !gameEnded.current) {
//       const score = calculateScore(board, markedNumbers);
      
//       if (score >= 5) {
//         gameEnded.current = true;
//         setGameResult("You Won! 🎉");
//         setPhase("finished");
//         socket.emit("game_won", { room });
//       }
//     }
//   }, [markedNumbers, board, phase, room]);

//   // --- ACTIONS ---

//   const calculateScore = (currentBoard, marked) => {
//     let lines = 0;
//     WINNING_LINES.forEach((line) => {
//       if (line.every((idx) => marked.includes(currentBoard[idx]))) lines++;
//     });
//     return lines;
//   };

//   const createRoom = (code) => {
//     if (!code) return;
//     socket.emit("create_room", code);
//   };

//   const joinRoom = (code) => {
//     if (!code) return;
//     socket.emit("join_room", code);
//   };
  
//   const autoFillBoard = () => {
//     const nums = Array.from({ length: 25 }, (_, i) => i + 1);
//     // Fisher-Yates Shuffle
//     for (let i = nums.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [nums[i], nums[j]] = [nums[j], nums[i]];
//     }
//     setBoard(nums);
//     setNextNum(26);
//   };

//   const manualFill = (index) => {
//     if (board[index] !== null || nextNum > 25) return;
//     const newBoard = [...board];
//     newBoard[index] = nextNum;
//     setBoard(newBoard);
//     setNextNum(nextNum + 1);
//   };

//   const playerReady = () => {
//     setPhase("waiting_others");
//     socket.emit("player_ready", room);
//   };

//   const startGame = () => {
//     socket.emit("request_start_game", room);
//   };

//   const makeMove = (number) => {
//     if (!isMyTurn || markedNumbers.includes(number)) return;
//     socket.emit("send_move", { room, number });
//   };

//   const sendEmoji = (emoji) => {
//     socket.emit("send_emoji", { room, emoji });
//   };

//   const resetGame = () => {
//     window.location.reload();
//   };

//   return (
//     <GameContext.Provider
//       value={{
//         // State
//         room, isJoined, isHost, phase, board, markedNumbers, isMyTurn, 
//         gameResult, nextNum, error, floatingEmojis,
        
//         // Actions
//         createRoom, joinRoom, autoFillBoard, manualFill, playerReady, 
//         startGame, makeMove, resetGame, calculateScore, sendEmoji
//       }}
//     >
//       {children}
//     </GameContext.Provider>
//   );
// };

// export const useGame = () => useContext(GameContext);


import React, { createContext, useState, useEffect, useRef, useContext } from "react";
import io from "socket.io-client";

const GameContext = createContext();

// ⚠️ IMPORTANT: Replace this with your actual Render Backend URL
// const SOCKET_URL = "http://localhost:3001"; 
const SOCKET_URL = "https://bingo-server-bvpo.onrender.com"; 

// FIX: Force WebSocket transport to prevent mobile connection issues
const socket = io.connect(SOCKET_URL, {
  transports: ["websocket"], // Skips HTTP polling, connects instantly
  reconnectionAttempts: 5,   // Retry if connection fails
  reconnectionDelay: 1000,   // Wait 1s between retries
});

const WINNING_LINES = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
];

export const GameProvider = ({ children }) => {
  // --- STATE ---
  const [room, setRoom] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  
  // Phases: setup -> waiting_others -> waiting_host -> host_ready -> playing -> finished
  const [phase, setPhase] = useState("setup"); 
  
  const [board, setBoard] = useState(Array(25).fill(null));
  const [markedNumbers, setMarkedNumbers] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameResult, setGameResult] = useState("");
  const [nextNum, setNextNum] = useState(1);
  const [error, setError] = useState("");
  
  // New Features State
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  const gameEnded = useRef(false);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    // 1. Connection Status
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
      setIsConnected(true);
      setError(""); 
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
      setError("Disconnected. Reconnecting...");
    });

    socket.on("connect_error", (err) => {
      console.error("Connection Error:", err);
      setIsConnected(false);
      setError("Connection Failed. Check internet.");
    });

    // 2. Room Logic
    socket.on("room_created", ({ room, isHost }) => {
      setRoom(room);
      setIsJoined(true);
      setIsHost(isHost);
      setError("");
    });

    socket.on("room_joined", ({ room, isHost }) => {
      setRoom(room);
      setIsJoined(true);
      setIsHost(isHost);
      setError("");
    });

    socket.on("error_message", (msg) => {
      setError(msg);
      setTimeout(() => setError(""), 3000);
    });

    // 3. Setup Phase Logic
    socket.on("host_can_start", () => setPhase("host_ready"));
    socket.on("waiting_for_host", () => setPhase("waiting_host"));

    // 4. Game Logic
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

    // 5. Emoji Logic
    socket.on("receive_emoji", (emoji) => {
      const id = Date.now() + Math.random();
      setFloatingEmojis((prev) => [...prev, { id, emoji }]);
      setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
      }, 2000);
    });

    // 6. Rematch / Reset Logic
    socket.on("game_reset", () => {
      // Reset local state to start a new game in the same room
      setPhase("setup");
      setBoard(Array(25).fill(null));
      setMarkedNumbers([]);
      setGameResult("");
      setNextNum(1);
      gameEnded.current = false;
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("error_message");
      socket.off("host_can_start");
      socket.off("waiting_for_host");
      socket.off("game_start");
      socket.off("receive_move");
      socket.off("opponent_won");
      socket.off("receive_emoji");
      socket.off("game_reset");
    };
  }, []);

  // --- CHECK WIN CONDITION ---
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

  // --- ACTIONS ---
  const calculateScore = (currentBoard, marked) => {
    let lines = 0;
    WINNING_LINES.forEach((line) => {
      if (line.every((idx) => marked.includes(currentBoard[idx]))) lines++;
    });
    return lines;
  };

  const createRoom = (code) => {
    if (!isConnected) {
      setError("Not connected to server!");
      return;
    }
    if (!code) return;
    socket.emit("create_room", code);
  };

  const joinRoom = (code) => {
    if (!isConnected) {
      setError("Not connected to server!");
      return;
    }
    if (!code) return;
    socket.emit("join_room", code);
  };
  
  const autoFillBoard = () => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1);
    // Fisher-Yates Shuffle
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
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

  const sendEmoji = (emoji) => socket.emit("send_emoji", { room, emoji });
  
  // Trigger Rematch (Play Again)
  const playAgain = () => {
    socket.emit("reset_game", { room });
  };

  // Go Home (Full Page Reload)
  const resetGame = () => {
    window.location.reload();
  };

  return (
    <GameContext.Provider
      value={{
        // State
        room, isJoined, isHost, phase, board, markedNumbers, isMyTurn, 
        gameResult, nextNum, error, floatingEmojis, isConnected,
        
        // Actions
        createRoom, joinRoom, autoFillBoard, manualFill, playerReady, 
        startGame, makeMove, resetGame, playAgain, calculateScore, sendEmoji
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);