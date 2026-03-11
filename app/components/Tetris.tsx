// app/components/Tetris.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { ArrowLeft, ArrowRight, ArrowDown, RotateCw, Play, Pause, Hand } from "lucide-react";
import { 
  BOARD_WIDTH, BOARD_HEIGHT, createEmptyBoard, getRandomTetromino, 
  checkCollision, rotatePiece, TetrominoType 
} from "../utils/tetris";

export default function Tetris() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [player, setPlayer] = useState({ pos: { x: 3, y: 0 }, tetromino: getRandomTetromino() });
  const [nextPiece, setNextPiece] = useState(getRandomTetromino());
  const [holdPiece, setHoldPiece] = useState<{ type: TetrominoType, shape: number[][], color: string } | null>(null);
  const [canHold, setCanHold] = useState(true);
  
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // NEW STATE: Tracks which rows are currently animating their deletion
  const [clearingRows, setClearingRows] = useState<number[]>([]);

// STANDARD SPEED FIX: Classic NES Tetris Frame-to-Ms Lookup Table
  // This provides a much smoother, playable difficulty ramp
  const calculateDropTime = (lvl: number) => {
    if (lvl <= 1) return 800; // ~48 frames
    if (lvl === 2) return 716; // ~43 frames
    if (lvl === 3) return 633; // ~38 frames
    if (lvl === 4) return 550; // ~33 frames
    if (lvl === 5) return 466; // ~28 frames
    if (lvl === 6) return 383; // ~23 frames
    if (lvl === 7) return 300; // ~18 frames
    if (lvl === 8) return 216; // ~13 frames
    if (lvl === 9) return 133; // ~8 frames
    if (lvl === 10) return 100; // ~6 frames
    if (lvl >= 11 && lvl <= 12) return 83; // ~5 frames (Much more playable for Level 11!)
    if (lvl >= 13 && lvl <= 15) return 66; // ~4 frames
    if (lvl >= 16 && lvl <= 18) return 50; // ~3 frames
    if (lvl >= 19 && lvl <= 28) return 33; // ~2 frames
    return 16; // 1 frame (Level 29+ "Kill Screen")
  };

  // Pause the game loop completely if we are animating a row clear
  const dropTime = (isPaused || clearingRows.length > 0) ? null : calculateDropTime(level);

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setPlayer({ pos: { x: 3, y: 0 }, tetromino: getRandomTetromino() });
    setNextPiece(getRandomTetromino());
    setHoldPiece(null);
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setCanHold(true);
    setClearingRows([]);
  };

  const confirmNewGame = () => {
    setIsPaused(true);
    Swal.fire({
      title: "New Game?",
      text: "Start over?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Resume"
    }).then((result) => {
      if (result.isConfirmed) resetGame();
      else setIsPaused(false);
    });
  };

  const drop = useCallback(() => {
    // Stop dropping if game over, paused, or currently animating a line clear
    if (gameOver || isPaused || clearingRows.length > 0) return;

    if (!checkCollision({ shape: player.tetromino.shape, x: player.pos.x, y: player.pos.y + 1 }, board)) {
      setPlayer((prev) => ({ ...prev, pos: { x: prev.pos.x, y: prev.pos.y + 1 } }));
    } else {
      // Lock piece
      if (player.pos.y <= 0) {
        setGameOver(true);
        Swal.fire({ title: "Game Over", text: `Score: ${score}`, icon: "error" });
        return;
      }
      
      const newBoard = board.map(row => [...row]);
      player.tetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0 && player.pos.y + y >= 0) {
            newBoard[player.pos.y + y][player.pos.x + x] = player.tetromino.color;
          }
        });
      });

      // Find full rows
      const fullRows: number[] = [];
      newBoard.forEach((row, y) => {
        if (row.every(cell => cell !== null)) fullRows.push(y);
      });

      if (fullRows.length > 0) {
        // TRIGGER ANIMATION: Set the board (to show locked piece) and record rows to clear
        setBoard(newBoard);
        setClearingRows(fullRows);
        
        // Wait for 300ms for CSS animation to finish, then actually remove them
        setTimeout(() => {
          const finalBoard = newBoard.filter((_, idx) => !fullRows.includes(idx));
          while (finalBoard.length < BOARD_HEIGHT) {
            finalBoard.unshift(new Array(BOARD_WIDTH).fill(null));
          }
          setBoard(finalBoard);
          setClearingRows([]);
          
          // Add Score
          const linePoints = [0, 40, 100, 300, 1200];
          const newScore = score + (linePoints[fullRows.length] * level);
          setScore(newScore);
          setLevel(Math.floor(newScore / 500) + 1);

          // Spawn next piece
          setPlayer({ pos: { x: 3, y: 0 }, tetromino: nextPiece });
          setNextPiece(getRandomTetromino());
          setCanHold(true);
        }, 300);

      } else {
        // No lines to clear, just spawn next piece
        setBoard(newBoard);
        setPlayer({ pos: { x: 3, y: 0 }, tetromino: nextPiece });
        setNextPiece(getRandomTetromino());
        setCanHold(true);
      }
    }
  }, [player, board, gameOver, isPaused, clearingRows, nextPiece, score, level]);

  const movePlayer = (dir: number) => {
    if (clearingRows.length > 0) return; // Disable movement during clear
    if (!checkCollision({ shape: player.tetromino.shape, x: player.pos.x + dir, y: player.pos.y }, board)) {
      setPlayer((prev) => ({ ...prev, pos: { x: prev.pos.x + dir, y: prev.pos.y } }));
    }
  };

  const rotatePlayer = () => {
    if (clearingRows.length > 0) return;
    const rotated = rotatePiece(player.tetromino.shape);
    if (!checkCollision({ shape: rotated, x: player.pos.x, y: player.pos.y }, board)) {
      setPlayer((prev) => ({ ...prev, tetromino: { ...prev.tetromino, shape: rotated } }));
    }
  };

  const hold = () => {
    if (!canHold || gameOver || isPaused || clearingRows.length > 0) return;
    if (!holdPiece) {
      setHoldPiece(player.tetromino);
      setPlayer({ pos: { x: 3, y: 0 }, tetromino: nextPiece });
      setNextPiece(getRandomTetromino());
    } else {
      const temp = player.tetromino;
      setPlayer({ pos: { x: 3, y: 0 }, tetromino: holdPiece });
      setHoldPiece(temp);
    }
    setCanHold(false);
  };

  const hardDrop = () => {
    if (clearingRows.length > 0) return;
    let dropY = player.pos.y;
    while (!checkCollision({ shape: player.tetromino.shape, x: player.pos.x, y: dropY + 1 }, board)) {
      dropY++;
    }
    setPlayer((prev) => ({ ...prev, pos: { ...prev.pos, y: dropY } }));
  };

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || isPaused || clearingRows.length > 0) return;
      if (e.key === "ArrowLeft") movePlayer(-1);
      else if (e.key === "ArrowRight") movePlayer(1);
      else if (e.key === "ArrowDown") drop();
      else if (e.key === "ArrowUp") rotatePlayer();
      else if (e.key === " ") { e.preventDefault(); hardDrop(); }
      else if (e.key === "c" || e.key === "Shift") hold();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [player, gameOver, isPaused, clearingRows, movePlayer, drop, rotatePlayer, hardDrop, hold]);

  // Game Loop
  useEffect(() => {
    if (dropTime === null) return;
    const interval = setInterval(drop, dropTime);
    return () => clearInterval(interval);
  }, [drop, dropTime]);

  const renderMiniGrid = (piece: any, title: string) => (
    <div className="bg-gray-800 p-2 rounded-lg border-2 border-gray-700 w-24 h-24 flex flex-col items-center justify-center">
      <h3 className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">{title}</h3>
      <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${piece?.shape[0]?.length || 4}, minmax(0, 1fr))` }}>
        {piece?.shape.map((row: any, y: number) =>
          row.map((cell: any, x: number) => (
            <div key={`${y}-${x}`} className={`w-4 h-4 ${cell ? piece.color : 'bg-transparent'}`} />
          ))
        )}
      </div>
    </div>
  );

  let ghostY = player.pos.y;
  while (!checkCollision({ shape: player.tetromino.shape, x: player.pos.x, y: ghostY + 1 }, board)) {
    ghostY++;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto font-sans select-none touch-none">
      
      {/* Top Header / Mobile Layout */}
      <div className="flex justify-between w-full mb-4 px-2 sm:px-0">
        <div className="flex flex-col gap-2">
          {renderMiniGrid(holdPiece, "Hold")}
          <button onClick={() => setIsPaused(!isPaused)} className="bg-gray-700 text-white p-2 rounded-lg flex justify-center items-center hover:bg-gray-600">
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>

        {/* Board */}
        <div className="bg-gray-900 border-4 border-gray-700 p-1 rounded-lg">
          <div className="grid gap-px bg-gray-800 relative" style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, 20px)`, gridTemplateRows: `repeat(${BOARD_HEIGHT}, 20px)` }}>
            
            {/* Render Static Board with Animation support */}
            {board.map((row, y) => {
              const isClearing = clearingRows.includes(y);
              return row.map((cell, x) => (
                <div 
                  key={`board-${y}-${x}`} 
                  className={`w-[20px] h-[20px] transition-all duration-300 ${
                    isClearing 
                      ? "bg-white scale-0 opacity-0 rounded-full" 
                      : cell ? `${cell} border border-black/20` : "bg-gray-900"
                  }`} 
                />
              ));
            })}

            {/* Render Ghost Piece */}
            {!gameOver && clearingRows.length === 0 && player.tetromino.shape.map((row, y) =>
              row.map((cell, x) => {
                const boardY = ghostY + y;
                const boardX = player.pos.x + x;
                if (cell !== 0 && boardY >= 0 && boardY < BOARD_HEIGHT) {
                  return (
                    <div 
                      key={`ghost-${y}-${x}`} 
                      className={`w-[20px] h-[20px] absolute bg-gray-500/30 border-2 border-dashed border-gray-400/50`}
                      style={{ top: boardY * 21, left: boardX * 21 }} 
                    />
                  );
                }
                return null;
              })
            )}

            {/* Render Active Player Piece */}
            {!gameOver && clearingRows.length === 0 && player.tetromino.shape.map((row, y) =>
              row.map((cell, x) => {
                const boardY = player.pos.y + y;
                const boardX = player.pos.x + x;
                if (cell !== 0 && boardY >= 0 && boardY < BOARD_HEIGHT) {
                  return (
                    <div 
                      key={`player-${y}-${x}`} 
                      className={`w-[20px] h-[20px] absolute ${player.tetromino.color} border border-black/20 transition-all duration-[75ms] ease-out z-10`}
                      style={{ top: boardY * 21, left: boardX * 21 }} 
                    />
                  );
                }
                return null;
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {renderMiniGrid(nextPiece, "Next")}
          <div className="bg-gray-800 p-2 rounded-lg border-2 border-gray-700 text-center text-white">
            <p className="text-xs text-gray-400">SCORE</p>
            <p className="font-bold">{score}</p>
          </div>
          <div className="bg-gray-800 p-2 rounded-lg border-2 border-gray-700 text-center text-white">
            <p className="text-xs text-gray-400">LEVEL</p>
            <p className="font-bold">{level}</p>
          </div>
        </div>
      </div>

      {/* Mobile Controls & New Game */}
      <div className="w-full flex flex-col gap-3 px-2 sm:px-0 mt-2">
        <div className="grid grid-cols-4 gap-2 sm:hidden">
          <button onClick={hold} className="bg-purple-600 active:bg-purple-700 text-white p-4 rounded-xl flex justify-center"><Hand size={24} /></button>
          <button onClick={() => movePlayer(-1)} className="bg-blue-600 active:bg-blue-700 text-white p-4 rounded-xl flex justify-center"><ArrowLeft size={24} /></button>
          <button onClick={() => movePlayer(1)} className="bg-blue-600 active:bg-blue-700 text-white p-4 rounded-xl flex justify-center"><ArrowRight size={24} /></button>
          <button onClick={rotatePlayer} className="bg-orange-500 active:bg-orange-600 text-white p-4 rounded-xl flex justify-center"><RotateCw size={24} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:hidden">
          <button onClick={drop} className="bg-gray-600 active:bg-gray-700 text-white p-4 rounded-xl flex justify-center"><ArrowDown size={24} /> Soft Drop</button>
          <button onClick={hardDrop} className="bg-red-600 active:bg-red-700 text-white p-4 rounded-xl font-bold">HARD DROP</button>
        </div>

        <button onClick={confirmNewGame} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg">
          New Game
        </button>
      </div>

    </div>
  );
}