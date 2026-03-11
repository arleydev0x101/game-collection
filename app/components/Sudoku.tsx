// app/components/Sudoku.tsx
"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { generateSudoku } from "../utils/sudoku";

type Cell = { value: number | null; isFixed: boolean; isWrong: boolean };

export default function Sudoku() {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isGameWon, setIsGameWon] = useState(false);

  // Initialize game on first load
  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const { puzzle, solution: solved } = generateSudoku();
    const newBoard = puzzle.map((row) =>
      row.map((val) => ({
        value: val === 0 ? null : val,
        isFixed: val !== 0,
        isWrong: false,
      }))
    );
    setSolution(solved);
    setBoard(newBoard);
    setSelectedCell(null);
    setMessage(null);
    setIsGameWon(false);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isGameWon) return;
    const { r, c } = selectedCell;

    if (board[r][c].isFixed) return;

    const newBoard = [...board].map(row => [...row]);

    // Check against the solution: Red if wrong, Black/Blue if right
    const isWrong = num !== solution[r][c];

    newBoard[r][c] = { ...newBoard[r][c], value: num, isWrong };
    setBoard(newBoard);

    // Check Win Condition
    checkWin(newBoard);
  };

  const checkWin = (currentBoard: Cell[][]) => {
    let isCompleteAndCorrect = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c].value === null || currentBoard[r][c].isWrong) {
          isCompleteAndCorrect = false;
          break;
        }
      }
    }

    if (isCompleteAndCorrect) {
      setIsGameWon(true);
      setMessage("You Won!");
      // Wait 5 seconds, then auto-restart
      setTimeout(() => {
        initGame();
      }, 5000);
    }
  };

  const startNewGame = () => {
    Swal.fire({
      title: "Start a new game?",
      text: "Your current progress will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, start it!"
    }).then((result) => {
      if (result.isConfirmed) {
        initGame();
      }
    });
  };

  if (board.length === 0) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto relative">
      {/* Win Message Overlay */}
      {message && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 rounded-xl">
          <h1 className="text-5xl font-extrabold text-green-600 animate-bounce">{message}</h1>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 text-gray-800">Sudoku</h1>

      {/* The Grid */}
      <div className="grid grid-cols-9 gap-0 border-4 border-gray-800 bg-gray-800 w-full aspect-square mb-6">
        {board.map((row, rIndex) =>
          row.map((cell, cIndex) => {
            const isRightBorder = (cIndex + 1) % 3 === 0 && cIndex !== 8;
            const isBottomBorder = (rIndex + 1) % 3 === 0 && rIndex !== 8;
            const isSelected = selectedCell?.r === rIndex && selectedCell?.c === cIndex;

            return (
              <div
                key={`${rIndex}-${cIndex}`}
                onClick={() => setSelectedCell({ r: rIndex, c: cIndex })}
                className={`flex items-center justify-center text-xl md:text-2xl font-semibold cursor-pointer select-none transition-colors
                  ${isRightBorder ? "border-r-4 border-r-gray-800" : "border-r border-r-gray-300"}
                  ${isBottomBorder ? "border-b-4 border-b-gray-800" : "border-b border-b-gray-300"}
                  ${isSelected ? "bg-blue-200" : "bg-white hover:bg-blue-50"}
                  ${cell.isFixed ? "text-gray-900" : cell.isWrong ? "text-red-500" : "text-gray-900"}
                `}
              >
                {cell.value || ""}
              </div>
            );
          })
        )}
      </div>

      {/* Number Pad (1-9) */}
      <div className="grid grid-cols-5 md:grid-cols-9 gap-2 mb-6 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            disabled={isGameWon}
            className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 font-bold py-3 md:py-4 rounded shadow active:scale-95 transition-transform"
          >
            {num}
          </button>
        ))}
      </div>

      {/* New Game Button */}
      <button
        onClick={startNewGame}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition-colors"
      >
        New Game
      </button>
    </div>
  );
}