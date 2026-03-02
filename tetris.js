import { useState, useEffect, useCallback } from "react";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TICK_SPEED = 500;

const TETROMINOES = {
  I: { shape: [[1,1,1,1]], color: "#00f0f0" },
  O: { shape: [[1,1],[1,1]], color: "#f0f000" },
  T: { shape: [[0,1,0],[1,1,1]], color: "#a000f0" },
  S: { shape: [[0,1,1],[1,1,0]], color: "#00f000" },
  Z: { shape: [[1,1,0],[0,1,1]], color: "#f00000" },
  J: { shape: [[1,0,0],[1,1,1]], color: "#0000f0" },
  L: { shape: [[0,0,1],[1,1,1]], color: "#f0a000" },
};

const PIECES = Object.keys(TETROMINOES);

const emptyBoard = () => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));

const randomPiece = () => {
  const key = PIECES[Math.floor(Math.random() * PIECES.length)];
  return { key, shape: TETROMINOES[key].shape, color: TETROMINOES[key].color, x: 3, y: 0 };
};

const rotate = (shape) => shape[0].map((_, i) => shape.map(row => row[i]).reverse());

const isValid = (board, shape, x, y) => {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        const nr = y + r, nc = x + c;
        if (nr < 0 || nr >= BOARD_HEIGHT || nc < 0 || nc >= BOARD_WIDTH || board[nr][nc]) return false;
      }
  return true;
};

const place = (board, piece) => {
  const b = board.map(r => [...r]);
  piece.shape.forEach((row, r) =>
    row.forEach((cell, c) => { if (cell) b[piece.y + r][piece.x + c] = piece.color; })
  );
  return b;
};

const clearLines = (board) => {
  const cleared = board.filter(row => row.some(cell => !cell));
  const lines = BOARD_HEIGHT - cleared.length;
  return { board: [...Array(lines).fill(null).map(() => Array(BOARD_WIDTH).fill(null)), ...cleared], lines };
};

export default function Tetris() {
  const [board, setBoard] = useState(emptyBoard());
  const [piece, setPiece] = useState(randomPiece());
  const [next, setNext] = useState(randomPiece());
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

  const lock = useCallback((b, p) => {
    const newBoard = place(b, p);
    const { board: cleared, lines: l } = clearLines(newBoard);
    setBoard(cleared);
    setScore(s => s + [0, 100, 300, 500, 800][l]);
    setLines(ln => ln + l);
    const n = randomPiece();
    if (!isValid(cleared, next.shape, next.x, next.y)) {
      setGameOver(true);
    } else {
      setPiece({ ...next });
      setNext(n);
    }
  }, [next]);

  const drop = useCallback(() => {
    if (gameOver || paused) return;
    setPiece(p => {
      if (isValid(board, p.shape, p.x, p.y + 1)) return { ...p, y: p.y + 1 };
      lock(board, p);
      return p;
    });
  }, [board, gameOver, paused, lock]);

  useEffect(() => {
    const id = setInterval(drop, TICK_SPEED);
    return () => clearInterval(id);
  }, [drop]);

  useEffect(() => {
    const handle = (e) => {
      if (gameOver) return;
      if (e.key === "ArrowLeft") setPiece(p => isValid(board, p.shape, p.x - 1, p.y) ? { ...p, x: p.x - 1 } : p);
      if (e.key === "ArrowRight") setPiece(p => isValid(board, p.shape, p.x + 1, p.y) ? { ...p, x: p.x + 1 } : p);
      if (e.key === "ArrowDown") drop();
      if (e.key === "ArrowUp") setPiece(p => { const r = rotate(p.shape); return isValid(board, r, p.x, p.y) ? { ...p, shape: r } : p; });
      if (e.key === " ") {
        setPiece(p => {
          let ny = p.y;
          while (isValid(board, p.shape, p.x, ny + 1)) ny++;
          const dropped = { ...p, y: ny };
          lock(board, dropped);
          return dropped;
        });
      }
      if (e.key === "p" || e.key === "P") setPaused(v => !v);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [board, drop, gameOver, lock]);

  const reset = () => {
    setBoard(emptyBoard());
    setPiece(randomPiece());
    setNext(randomPiece());
    setScore(0);
    setLines(0);
    setGameOver(false);
    setPaused(false);
  };

  const display = piece ? place(board, piece) : board;

  const renderMini = (shape, color) => {
    const grid = Array.from({ length: 4 }, () => Array(4).fill(null));
    shape.forEach((row, r) => row.forEach((cell, c) => { if (cell) grid[r][c] = color; }));
    return grid.slice(0, shape.length).map((row, r) => (
      <div key={r} style={{ display: "flex" }}>
        {row.slice(0, shape[0].length).map((cell, c) => (
          <div key={c} style={{ width: 20, height: 20, background: cell || "transparent", border: cell ? "1px solid rgba(255,255,255,0.2)" : "none", borderRadius: 2 }} />
        ))}
      </div>
    ));
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#1a1a2e", fontFamily: "monospace", color: "white" }}>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Board */}
        <div style={{ border: "2px solid #444", background: "#0d0d1a" }}>
          {display.map((row, r) => (
            <div key={r} style={{ display: "flex" }}>
              {row.map((cell, c) => (
                <div key={c} style={{ width: 28, height: 28, background: cell || "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 2, boxShadow: cell ? "inset 0 0 6px rgba(255,255,255,0.15)" : "none" }} />
              ))}
            </div>
          ))}
        </div>

        {/* Side panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 120 }}>
          <div>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>SCORE</div>
            <div style={{ fontSize: 22, fontWeight: "bold", color: "#f0a000" }}>{score}</div>
          </div>
          <div>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>LINES</div>
            <div style={{ fontSize: 22, fontWeight: "bold" }}>{lines}</div>
          </div>
          <div>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>NEXT</div>
            <div style={{ background: "#0d0d1a", padding: 8, border: "1px solid #333", borderRadius: 4 }}>
              {renderMini(next.shape, next.color)}
            </div>
          </div>

          {gameOver && (
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f00", fontWeight: "bold", marginBottom: 8 }}>GAME OVER</div>
              <button onClick={reset} style={{ background: "#f0a000", border: "none", color: "#000", padding: "6px 14px", cursor: "pointer", borderRadius: 4, fontWeight: "bold" }}>Restart</button>
            </div>
          )}
          {!gameOver && (
            <button onClick={() => setPaused(v => !v)} style={{ background: "#333", border: "1px solid #555", color: "white", padding: "6px 14px", cursor: "pointer", borderRadius: 4 }}>
              {paused ? "Resume" : "Pause"}
            </button>
          )}

          <div style={{ fontSize: 11, color: "#555", lineHeight: 1.8 }}>
            ← → Move<br />↑ Rotate<br />↓ Soft drop<br />Space Hard drop<br />P Pause
          </div>
        </div>
      </div>
    </div>
  );
}