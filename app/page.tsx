// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Menu, Grid3X3, Crown, SquareStack, Calculator, CircleDot, X, HelpCircle } from "lucide-react";
import Swal from "sweetalert2";
import { Analytics } from "@vercel/analytics/next";

// Import all our completed game components
import Sudoku from "./components/Sudoku";
import ChessGame from "./components/ChessGame";
import Tetris from "./components/Tetris";
import Game2048 from "./components/Game2048";
import CheckersGame from "./components/CheckersGame";
import TicTacToe from "./components/TicTacToe";

export default function Home() {
  const [activeGame, setActiveGame] = useState("sudoku");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedGame = localStorage.getItem("activeGame");
    if (savedGame) {
      setActiveGame(savedGame);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("activeGame", activeGame);
    }
  }, [activeGame, isMounted]);

  const showHelp = () => {
    let title = "";
    let html = "";

    switch (activeGame) {
      case "sudoku":
        title = "How to Play Sudoku";
        html = `
          <div class="text-left text-sm md:text-base space-y-3">
            <p><b>Goal:</b> Fill the 9x9 grid so every row, column, and 3x3 box contains numbers 1-9 without repeating.</p>
            <p><b>Desktop & Mobile:</b> Tap or click an empty square to select it, then use the number pad below the board to fill in your answer.</p>
            <p class="text-red-500 font-bold">Note: Red numbers mean your answer is incorrect against the solution!</p>
          </div>
        `;
        break;
      case "chess":
        title = "How to Play Chess";
        html = `
          <div class="text-left text-sm md:text-base space-y-3">
            <p><b>Goal:</b> Trap the opponent's king so it cannot escape (Checkmate!).</p>
            <p><b>Desktop:</b> Click and drag pieces, or click to select and click the target square.</p>
            <p><b>Mobile:</b> Tap a piece to select it. You will see valid moves highlighted with dots. Tap a dot or capture ring to move there.</p>
          </div>
        `;
        break;
      case "tetris":
        title = "How to Play Tetris";
        html = `
          <div class="text-left text-sm md:text-base space-y-3">
            <p><b>Goal:</b> Clear lines by filling rows with blocks to score points. Don't let the blocks reach the top!</p>
            <p><b>Desktop:</b> Use <b>W, A, S, D</b> to move and rotate. Press <b>Space</b> to Hard Drop. Press <b>C</b> or <b>Shift</b> to Hold a piece.</p>
            <p><b>Mobile:</b> Use the blue on-screen buttons below the board to move and rotate. Tap the purple Hand icon to Hold.</p>
          </div>
        `;
        break;
      case "2048":
        title = "How to Play 2048";
        html = `
          <div class="text-left text-sm md:text-base space-y-3">
            <p><b>Goal:</b> Slide and merge matching tiles to reach the legendary 2048 tile!</p>
            <p><b>Desktop:</b> Use the <b>Arrow Keys</b> (Up, Down, Left, Right) to slide all tiles across the board.</p>
            <p><b>Mobile:</b> <b>Swipe</b> anywhere on the game board in the direction you want the tiles to slide.</p>
          </div>
        `;
        break;
      case "checkers":
        title = "How to Play Checkers";
        html = `
          <div class="text-left text-sm md:text-base space-y-3">
            <p><b>Goal:</b> Capture all opponent pieces by jumping over them.</p>
            <p><b>Rules:</b> Pieces move diagonally forward. If you <i>can</i> jump an opponent, you are forced to! Reach the opposite side to crown a King, which can move backward.</p>
            <p><b>Desktop & Mobile:</b> Tap your piece to select it, then tap the highlighted yellow dot to move or jump.</p>
          </div>
        `;
        break;
      case "tictactoe":
        title = "How to Play Tic-Tac-Toe";
        html = `
          <div class="text-left text-sm md:text-base space-y-3">
            <p><b>Goal:</b> Be the first to get 3 of your marks in a row (horizontal, vertical, or diagonal).</p>
            <p><b>Desktop & Mobile:</b> Tap or click any empty square on the grid to place your X or O.</p>
            <p><i>Tip: The "Expert" AI uses the Minimax algorithm and is mathematically unbeatable!</i></p>
          </div>
        `;
        break;
    }

    Swal.fire({
      title: title,
      html: html,
      icon: "info",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Got it!",
    });
  };

  const games = [
    { id: "sudoku", name: "Sudoku", icon: <Grid3X3 size={24} /> },
    { id: "chess", name: "Chess", icon: <Crown size={24} /> },
    { id: "tetris", name: "Tetris", icon: <SquareStack size={24} /> },
    { id: "2048", name: "2048", icon: <Calculator size={24} /> },
    { id: "checkers", name: "Checkers", icon: <CircleDot size={24} /> },
    { id: "tictactoe", name: "Tic-Tac-Toe", icon: <X size={24} /> },
  ];

  if (!isMounted) return <div className="min-h-screen bg-gray-50" />;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col relative font-sans pb-16">
      <Analytics />
      {/* Top Right Navigation (Game Switcher) */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-3 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 transition-all"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* Bottom Right Navigation (Help/How to Play) */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={showHelp}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
        >
          <HelpCircle size={28} />
        </button>
      </div>

      {/* Game Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-gray-100 flex justify-between items-center border-b">
              <h2 className="text-xl font-bold text-gray-800">Choose a Game</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    setActiveGame(game.id);
                    setIsModalOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${activeGame === game.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                    }`}
                >
                  <div className="text-blue-600 mb-2">{game.icon}</div>
                  <span className="font-semibold text-gray-700">{game.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Display Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {activeGame === "sudoku" && <Sudoku />}
        {activeGame === "chess" && <ChessGame />}
        {activeGame === "tetris" && <Tetris />}
        {activeGame === "2048" && <Game2048 />}
        {activeGame === "checkers" && <CheckersGame />}
        {activeGame === "tictactoe" && <TicTacToe />}
      </div>
    </main>
  );
}
