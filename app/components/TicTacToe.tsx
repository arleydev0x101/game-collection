// app/components/TicTacToe.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { Board, Player, checkWinner, getBestTicTacToeMove } from "../utils/tictactoe";

export default function TicTacToe() {
  const players = new Map<Player, string>([
    ["X", "Player 1"],
    ["O", "Player 2"],
  ]);

  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>(players.get("X") ? "X" : "O");
  const [gameMode, setGameMode] = useState<"PvAI" | "PvP">("PvAI");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [playerSide, setPlayerSide] = useState<Player>(players.get("X") ? "X" : "O");
  const [gameStatus, setGameStatus] = useState(`${players.get(turn)}'s Turn`);
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);

  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);



  const updateGameStatus = useCallback((currentBoard: Board, currentTurn: Player) => {
    const winner = checkWinner(currentBoard);
    if (winner) {
      if (winner === "Draw") {
        setGameStatus("It's a Draw!");
        setOverlayMessage("It's a Draw! 🤝");
      } else {
        setGameStatus(`${players.get(winner)} Wins!`);
        setOverlayMessage(`${players.get(winner)} Wins! 🎉`);
        if (winner === "X") setScoreX(s => s + 1);
        if (winner === "O") setScoreO(s => s + 1);
      }
    } else {
      setGameStatus(`${players.get(currentTurn)}'s Turn`);
    }
  }, []);

  useEffect(() => {
    if (gameMode === "PvAI" && turn !== playerSide && !overlayMessage) {
      const timeout = setTimeout(() => {
        const aiMove = getBestTicTacToeMove([...board], turn as "X" | "O", difficulty);
        if (aiMove !== undefined) {
          const newBoard = [...board];
          newBoard[aiMove] = turn;
          setBoard(newBoard);
          const nextTurn = turn === "X" ? "O" : "X";
          setTurn(nextTurn);
          updateGameStatus(newBoard, nextTurn);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [board, turn, gameMode, playerSide, difficulty, overlayMessage, updateGameStatus]);

  const handleSquareClick = (index: number) => {
    if (overlayMessage || board[index]) return; 
    if (gameMode === "PvAI" && turn !== playerSide) return; 

    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);
    
    const nextTurn = turn === "X" ? "O" : "X";
    setTurn(nextTurn);
    updateGameStatus(newBoard, nextTurn);
  };

  const handleResign = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to resign?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, I yield!",
      confirmButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        setOverlayMessage("You Resigned! 🏳️");
        setGameStatus("Player Resigned.");
        if (playerSide === "X") setScoreO(s => s + 1);
        else setScoreX(s => s + 1);
      }
    });
  };

  const handleNewGame = () => {
    Swal.fire({
      title: "New Game?",
      text: "Start a fresh game?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
    }).then((result) => {
      if (result.isConfirmed) {
        setBoard(Array(9).fill(null));
        setTurn("X"); 
        setOverlayMessage(null);
        updateGameStatus(Array(9).fill(null), "X");
      }
    });
  };

  const handleSwapSide = () => {
    Swal.fire({
      title: "Swap Sides?",
      text: `You will restart playing as ${playerSide === "X" ? "O" : "X"}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
    }).then((result) => {
      if (result.isConfirmed) {
        setPlayerSide(playerSide === "X" ? "O" : "X");
        setBoard(Array(9).fill(null));
        setTurn("X");
        setOverlayMessage(null);
        updateGameStatus(Array(9).fill(null), "X");
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto relative font-sans">
      
      {overlayMessage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 rounded-xl backdrop-blur-sm">
          <h1 className="text-4xl font-extrabold text-white animate-pulse text-center p-4">
            {overlayMessage}
          </h1>
        </div>
      )}

      <div className="w-full flex justify-between items-end mb-2 px-2">
        <h2 className="text-xl font-bold text-gray-800">{gameStatus}</h2>
        <div className="text-sm font-bold text-gray-600 drop-shadow-md">
          {playerSide === "X" ? `${players.get("O")} Wins: ${scoreO}` : `${players.get("X")} Wins: ${scoreX}`}
        </div>
      </div>

      {/* FIX: Added grid-rows-3 to lock the height of the rows! */}
      <div className="w-full aspect-square border-4 border-gray-800 rounded-lg overflow-hidden bg-gray-800 grid grid-cols-3 grid-rows-3 gap-1">
        {board.map((cell, index) => (
          <div
            key={index}
            onClick={() => handleSquareClick(index)}
            // FIX: Added w-full and h-full to force the cell to obey the grid
            className="bg-white w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden"
          >
            {cell && (
              // FIX: Added leading-none to prevent the font's line-height from stretching the box
              <span className={`text-7xl sm:text-9xl font-black drop-shadow-md leading-none select-none ${cell === "X" ? "text-blue-600" : "text-red-600"}`}>
                {cell}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="w-full flex justify-end mt-2 px-2 h-6">
         <div className="text-sm font-bold text-gray-600 drop-shadow-md">
          {playerSide === "X" ? `X Wins: ${scoreX}` : `O Wins: ${scoreO}`}
        </div>
      </div>

      <div className="w-full mt-4 space-y-3">
        <button 
          onClick={handleResign}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded shadow-lg transition-colors flex items-center justify-center gap-2"
        >
          🏳️ Resign
        </button>

        {gameMode === "PvAI" && (
          <div className="grid grid-cols-4 gap-2">
            {["Easy", "Intermediate", "Hard", "Expert"].map(diff => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`py-2 text-xs md:text-sm font-bold rounded shadow transition-colors ${
                  difficulty === diff ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 w-full">
          <button 
            onClick={handleSwapSide}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded shadow transition-colors"
          >
            Swap Side
          </button>
          <button 
            onClick={handleNewGame}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded shadow transition-colors"
          >
            New Game
          </button>
        </div>

        <button 
          onClick={() => {
            setGameMode(gameMode === "PvAI" ? "PvP" : "PvAI");
            setBoard(Array(9).fill(null));
            setTurn("X");
            setOverlayMessage(null);
            updateGameStatus(Array(9).fill(null), "X");
          }}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded shadow transition-colors"
        >
          {gameMode === "PvAI" ? "Switch to Player vs Player" : "Switch to Player vs AI"}
        </button>
      </div>
    </div>
  );
}