import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

/* 🔌 SOCKET (create once) */
const socket = io("https://bingo-server-bvpo.onrender.com", {
  transports: ["websocket"],
});

const SIZE = 5;

/* ---------- HELPERS ---------- */
const emptyGrid = () =>
  Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

const emptyMarked = () =>
  Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

const randomGrid = () => {
  const nums = Array.from({ length: 25 }, (_, i) => i + 1).sort(
    () => Math.random() - 0.5
  );
  let k = 0;
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => nums[k++])
  );
};

function checkWin(marked) {
  let lines = 0;

  // rows
  for (let i = 0; i < SIZE; i++) {
    if (marked[i].every(Boolean)) lines++;
  }

  // columns
  for (let j = 0; j < SIZE; j++) {
    let col = true;
    for (let i = 0; i < SIZE; i++) if (!marked[i][j]) col = false;
    if (col) lines++;
  }

  // diagonals
  let d1 = true,
    d2 = true;
  for (let i = 0; i < SIZE; i++) {
    if (!marked[i][i]) d1 = false;
    if (!marked[i][SIZE - i - 1]) d2 = false;
  }
  if (d1) lines++;
  if (d2) lines++;

  return lines >= 5;
}

/* ---------- COMPONENT ---------- */
export default function App() {
  const [board, setBoard] = useState(emptyGrid());
  const [marked, setMarked] = useState(emptyMarked());

  const [filled, setFilled] = useState(false);
  const [nextNum, setNextNum] = useState(1);

  const [started, setStarted] = useState(false);
  const [myTurn, setMyTurn] = useState(false);

  const [calledNumber, setCalledNumber] = useState(null);
  const [winner, setWinner] = useState(null);

  /* ---------- SOCKET EVENTS ---------- */
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
    });

    socket.on("init", ({ board }) => {
      setBoard(board);
    });

    socket.on("start_game", ({ turn }) => {
      setStarted(true);
      setMyTurn(socket.id === turn);
    });

    socket.on("number_called", ({ number }) => {
      setCalledNumber(number);

      setMarked((prev) => {
        const copy = prev.map((r) => [...r]);
        board.forEach((row, i) =>
          row.forEach((cell, j) => {
            if (cell === number) copy[i][j] = true;
          })
        );

        if (checkWin(copy)) socket.emit("win");
        return copy;
      });

      setMyTurn(true); // next player's turn handled server-side
    });

    // socket.on("winner", (msg) => {
    //   setWinner(msg);
    // });

    socket.on("winner", (msg) => {
      if (msg === "YOU_WIN") setWinner("🎉 You Win!");
      if (msg === "OPPONENT_WIN") setWinner("❌ Opponent Wins!");
    });

    return () => {
      socket.off("connect");
      socket.off("init");
      socket.off("start_game");
      socket.off("number_called");
      socket.off("winner");
    };
  }, [board]);

  /* ---------- FILL PHASE ---------- */
  const manualFill = (i, j) => {
    if (filled || board[i][j] !== null) return;

    const copy = board.map((r) => [...r]);
    copy[i][j] = nextNum;
    setBoard(copy);

    if (nextNum === 25) setFilled(true);
    setNextNum((n) => n + 1);
  };

  const autoFill = () => {
    setBoard(randomGrid());
    setFilled(true);
  };

  const startGame = () => {
    socket.emit("ready");
  };

  /* ---------- GAME PHASE ---------- */
  const callNumber = (num) => {
    if (started && myTurn && !winner) {
      setMyTurn(false);
      socket.emit("call_number", num);
    }
  };

  return (
    <div className="app">
      <h1>🎯 Online Bingo</h1>

      <p>
        Last Number: <b>{calledNumber ?? "-"}</b>
      </p>

      {winner && <h2 className="winner">{winner}</h2>}

      {!started && (
        <div className="controls">
          <button onClick={autoFill}>Auto Fill</button>
          {filled && <button onClick={startGame}>Start Game</button>}
        </div>
      )}

      <div className="board">
        {board.map((row, i) =>
          row.map((cell, j) => (
            <button
              key={`${i}-${j}`}
              className={`cell ${marked[i][j] ? "marked" : ""}`}
              onClick={() =>
                started ? callNumber(cell) : manualFill(i, j)
              }
            >
              {cell ?? ""}
            </button>
          ))
        )}
      </div>

      {started && !winner && (
        <p className="turn">
          {myTurn ? "🟢 Your Turn" : "⏳ Opponent Turn"}
        </p>
      )}
    </div>
  );
}
