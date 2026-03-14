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
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null); // NEW: Countdown state
  
  const [clearingRows, setClearingRows] = useState<number[]>([]);

  useEffect(() => {
    const savedHighScore = localStorage.getItem("tetrisHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("tetrisHighScore", score.toString());
    }
  }, [score, highScore]);

  // NEW: Countdown Effect Hook
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsPaused(false);
      setCountdown(null);
    }
  }, [countdown]);

  // NEW: Toggle Pause Function
  const togglePause = () => {
    if (gameOver) return;
    if (isPaused && countdown === null) {
      setCountdown(3); // Start countdown when unpausing
    } else if (!isPaused) {
      setIsPaused(true);
      setCountdown(null);
    }
  };

  const calculateDropTime = (lvl: number) => {
    if (lvl <= 1) return 800; 
    if (lvl === 2) return 716; 
    if (lvl === 3) return 633; 
    if (lvl === 4) return 550; 
    if (lvl === 5) return 466; 
    if (lvl === 6) return 383; 
    if (lvl === 7) return 300; 
    if (lvl === 8) return 216; 
    if (lvl === 9) return 133; 
    if (lvl === 10) return 100; 
    if (lvl >= 11 && lvl <= 12) return 83; 
    if (lvl >= 13 && lvl <= 15) return 66; 
    if (lvl >= 16 && lvl <= 18) return 50; 
    if (lvl >= 19 && lvl <= 28) return 33; 
    return 16; 
  };

  // Pause gravity if paused, counting down, or clearing lines
  const dropTime = (isPaused || countdown !== null || clearingRows.length > 0) ? null : calculateDropTime(level);

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setPlayer({ pos: { x: 3, y: 0 }, tetromino: getRandomTetromino() });
    setNextPiece(getRandomTetromino());
    setHoldPiece(null);
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setCountdown(null);
    setCanHold(true);
    setClearingRows([]);
  };

  const confirmNewGame = () => {
    setIsPaused(true);
    setCountdown(null); // Clear any active countdown
    Swal.fire({
      title: "New Game?",
      text: "Start over?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Resume"
    }).then((result) => {
      if (result.isConfirmed) {
        resetGame();
      } else {
        setCountdown(3); // Resume with a countdown
      }
    });
  };

  const lockPiece = useCallback((lockX: number, lockY: number, currentTetromino: any) => {
    if (lockY <= 0) {
      setGameOver(true);
      Swal.fire({ title: "Game Over", text: `Score: ${score}`, icon: "error" });
      return;
    }
    
    const newBoard = board.map(row => [...row]);
    currentTetromino.shape.forEach((row: number[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value !== 0 && lockY + y >= 0) {
          newBoard[lockY + y][lockX + x] = currentTetromino.color;
        }
      });
    });

    const fullRows: number[] = [];
    newBoard.forEach((row, y) => {
      if (row.every(cell => cell !== null)) fullRows.push(y);
    });

    if (fullRows.length > 0) {
      setBoard(newBoard);
      setClearingRows(fullRows);
      
      setTimeout(() => {
        const finalBoard = newBoard.filter((_, idx) => !fullRows.includes(idx));
        while (finalBoard.length < BOARD_HEIGHT) {
          finalBoard.unshift(new Array(BOARD_WIDTH).fill(null));
        }
        setBoard(finalBoard);
        setClearingRows([]);
        
        const linePoints = [0, 40, 100, 300, 1200];
        const newScore = score + (linePoints[fullRows.length] * level);
        setScore(newScore);
        setLevel(Math.floor(newScore / 500) + 1);

        setPlayer({ pos: { x: 3, y: 0 }, tetromino: nextPiece });
        setNextPiece(getRandomTetromino());
        setCanHold(true);
      }, 300);

    } else {
      setBoard(newBoard);
      setPlayer({ pos: { x: 3, y: 0 }, tetromino: nextPiece });
      setNextPiece(getRandomTetromino());
      setCanHold(true);
    }
  }, [board, score, level, nextPiece]);

  const drop = useCallback(() => {
    if (gameOver || isPaused || countdown !== null || clearingRows.length > 0) return;

    if (!checkCollision({ shape: player.tetromino.shape, x: player.pos.x, y: player.pos.y + 1 }, board)) {
      setPlayer((prev) => ({ ...prev, pos: { x: prev.pos.x, y: prev.pos.y + 1 } }));
    } else {
      lockPiece(player.pos.x, player.pos.y, player.tetromino); 
    }
  }, [player, board, gameOver, isPaused, countdown, clearingRows, lockPiece]);

  const movePlayer = (dir: number) => {
    if (clearingRows.length > 0 || isPaused || countdown !== null || gameOver) return; 
    if (!checkCollision({ shape: player.tetromino.shape, x: player.pos.x + dir, y: player.pos.y }, board)) {
      setPlayer((prev) => ({ ...prev, pos: { x: prev.pos.x + dir, y: prev.pos.y } }));
    }
  };

  const rotatePlayer = () => {
    if (clearingRows.length > 0 || isPaused || countdown !== null || gameOver) return;
    const rotated = rotatePiece(player.tetromino.shape);
    if (!checkCollision({ shape: rotated, x: player.pos.x, y: player.pos.y }, board)) {
      setPlayer((prev) => ({ ...prev, tetromino: { ...prev.tetromino, shape: rotated } }));
    }
  };

  const hold = () => {
    if (!canHold || gameOver || isPaused || countdown !== null || clearingRows.length > 0) return;
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

  const hardDrop = useCallback(() => {
    if (gameOver || isPaused || countdown !== null || clearingRows.length > 0) return;
    
    let dropY = player.pos.y;
    while (!checkCollision({ shape: player.tetromino.shape, x: player.pos.x, y: dropY + 1 }, board)) {
      dropY++;
    }
    
    lockPiece(player.pos.x, dropY, player.tetromino);
  }, [player, board, gameOver, isPaused, countdown, clearingRows, lockPiece]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || isPaused || countdown !== null || clearingRows.length > 0) return;
      
      const key = e.key.toLowerCase();
      
      if (key === "a") movePlayer(-1);
      else if (key === "d") movePlayer(1);
      else if (key === "s") drop();
      else if (key === "w") rotatePlayer();
      else if (e.key === " ") { e.preventDefault(); hardDrop(); }
      else if (key === "c" || key === "shift") hold(); 
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [player, gameOver, isPaused, countdown, clearingRows, movePlayer, drop, rotatePlayer, hardDrop, hold]);

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
      
      <div className="flex justify-between w-full mb-4 px-2 sm:px-0">
        <div className="flex flex-col gap-2">
          {renderMiniGrid(holdPiece, "Hold")}
          {/* UPDATED: Play/Pause button now uses togglePause() */}
          <button 
            onClick={togglePause} 
            className={`text-white p-2 rounded-lg flex justify-center items-center transition-colors ${isPaused ? "bg-green-600 hover:bg-green-500" : "bg-gray-700 hover:bg-gray-600"}`}
          >
            {isPaused && countdown === null ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>

        <div className="bg-gray-900 border-4 border-gray-700 p-1 rounded-lg shadow-xl relative">
          
          {/* NEW: Pause & Countdown Overlay */}
          {(isPaused || countdown !== null) && !gameOver && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-sm rounded-sm">
              {countdown !== null ? (
                <h1 className="text-6xl font-black text-white animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                  {countdown}
                </h1>
              ) : (
                <h1 className="text-3xl font-black text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  PAUSED
                </h1>
              )}
            </div>
          )}

          <div className="grid gap-px bg-gray-800 relative" style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, 20px)`, gridTemplateRows: `repeat(${BOARD_HEIGHT}, 20px)` }}>
            
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
          
          <div className="bg-gray-800 p-2 rounded-lg border-2 border-yellow-600/50 text-center text-white shadow-[0_0_10px_rgba(202,138,4,0.2)]">
            <p className="text-[10px] text-yellow-400 font-black tracking-widest uppercase">High Score</p>
            <p className="font-bold">{highScore}</p>
          </div>

          <div className="bg-gray-800 p-2 rounded-lg border-2 border-gray-700 text-center text-white">
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Score</p>
            <p className="font-bold">{score}</p>
          </div>
          <div className="bg-gray-800 p-2 rounded-lg border-2 border-gray-700 text-center text-white">
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Level</p>
            <p className="font-bold">{level}</p>
          </div>
        </div>
      </div>

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