// app/components/Game2048.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { getEmptyBoard, addRandomTile, moveBoard, checkGameOver, Board } from "../utils/game2048";

// Tailwind color mapping for tiles
const getTileColor = (val: number) => {
  const colors: Record<number, string> = {
    0: "bg-gray-200 text-transparent",
    2: "bg-gray-100 text-gray-700",
    4: "bg-amber-100 text-gray-700",
    8: "bg-orange-300 text-white",
    16: "bg-orange-500 text-white",
    32: "bg-red-400 text-white",
    64: "bg-red-600 text-white",
    128: "bg-yellow-400 text-white text-4xl",
    256: "bg-yellow-500 text-white text-4xl",
    512: "bg-yellow-600 text-white text-4xl",
    1024: "bg-amber-500 text-white text-3xl",
    2048: "bg-amber-600 text-white text-3xl shadow-[0_0_15px_rgba(255,215,0,0.8)]",
  };
  return colors[val] || "bg-black text-white text-3xl";
};

export default function Game2048() {
  const [board, setBoard] = useState<Board>(getEmptyBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Touch handlers for mobile swipe
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const initGame = useCallback(() => {
    let newBoard = getEmptyBoard();
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleMove = useCallback((direction: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
    if (gameOver) return;

    const { newBoard, scoreGained, moved } = moveBoard(board, direction);
    
    if (moved) {
      const boardWithNewTile = addRandomTile(newBoard);
      setBoard(boardWithNewTile);
      setScore((prev) => prev + scoreGained);

      if (checkGameOver(boardWithNewTile)) {
        setGameOver(true);
        Swal.fire({
          title: "Game Over!",
          text: `You scored ${score + scoreGained} points!`,
          icon: "info",
          confirmButtonText: "Try Again"
        });
      }
    }
  }, [board, gameOver, score]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault(); // Prevent page scrolling
      }
      if (e.key === "ArrowUp") handleMove("UP");
      if (e.key === "ArrowDown") handleMove("DOWN");
      if (e.key === "ArrowLeft") handleMove("LEFT");
      if (e.key === "ArrowRight") handleMove("RIGHT");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  // Swipe logic
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStart.x;
    const dy = touchEndY - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Require a minimum swipe distance to prevent accidental triggers
    if (Math.max(absDx, absDy) > 30) {
      if (absDx > absDy) {
        handleMove(dx > 0 ? "RIGHT" : "LEFT");
      } else {
        handleMove(dy > 0 ? "DOWN" : "UP");
      }
    }
    setTouchStart(null);
  };

  const handleNewGameClick = () => {
    Swal.fire({
      title: "Restart Game?",
      text: "Are you sure you want to start over?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, restart!"
    }).then((result) => {
      if (result.isConfirmed) {
        initGame();
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto font-sans select-none">
      
      {/* Container: Row on Desktop, Col on Mobile */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start w-full justify-center">
        
        {/* Game Board */}
        <div 
          className="bg-gray-400 p-3 rounded-xl border-4 border-gray-500 touch-none relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {gameOver && (
            <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
              <span className="text-4xl font-bold text-gray-800">Game Over</span>
            </div>
          )}
          <div className="grid grid-cols-4 gap-3 bg-gray-400">
            {board.map((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center rounded-lg text-3xl sm:text-4xl md:text-5xl font-bold transition-all duration-150 ${getTileColor(val)}`}
                >
                  {val !== 0 ? val : ""}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Score Display (At the side on desktop, stacked on mobile) */}
        <div className="flex flex-row md:flex-col gap-4 w-full md:w-32 justify-center">
          <div className="bg-gray-800 p-4 rounded-xl border-2 border-gray-700 text-center w-full shadow-lg">
            <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-1">Score</p>
            <p className="text-2xl font-extrabold text-white">{score}</p>
          </div>
        </div>

      </div>

      {/* New Game Button Underneath */}
      <div className="w-full max-w-sm mt-8 px-4 sm:px-0">
        <button
          onClick={handleNewGameClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors text-lg"
        >
          New Game
        </button>
      </div>

    </div>
  );
}