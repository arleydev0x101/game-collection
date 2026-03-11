// app/components/CheckersGame.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { 
  Board, PieceColor, Position, Move, 
  getInitialBoard, getValidMoves, applyMove, getBestCheckersMove 
} from "../utils/checkers";

export default function CheckersGame() {
  const [board, setBoard] = useState<Board>(getInitialBoard());
  const [turn, setTurn] = useState<PieceColor>("w");
  const [gameMode, setGameMode] = useState<"PvAI" | "PvP">("PvAI");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [playerColor, setPlayerColor] = useState<PieceColor>("w");
  const [gameStatus, setGameStatus] = useState("White's Turn");
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);
  
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  
  const [capturedWhite, setCapturedWhite] = useState<number>(0);
  const [capturedBlack, setCapturedBlack] = useState<number>(0);

  const updateGameStatus = useCallback((currentBoard: Board, currentTurn: PieceColor) => {
    const moves = getValidMoves(currentBoard, currentTurn);
    if (moves.length === 0) {
      const winner = currentTurn === "w" ? "Black" : "White";
      setGameStatus(`${winner} Wins!`);
      setOverlayMessage(`${winner} Wins! No moves left.`);
    } else {
      setGameStatus(`${currentTurn === "w" ? "White" : "Black"}'s Turn`);
    }

    // Count Captures
    let wCount = 0;
    let bCount = 0;
    currentBoard.forEach(row => row.forEach(p => {
      if (p?.color === 'w') wCount++;
      if (p?.color === 'b') bCount++;
    }));
    setCapturedWhite(12 - wCount); // 12 is starting pieces
    setCapturedBlack(12 - bCount);
  }, []);

  // AI Turn Handling
  useEffect(() => {
    if (gameMode === "PvAI" && turn !== playerColor && !overlayMessage) {
      const timeout = setTimeout(() => {
        const move = getBestCheckersMove(board, turn, difficulty);
        if (move) {
          const newBoard = applyMove(board, move);
          setBoard(newBoard);
          const nextTurn = turn === "w" ? "b" : "w";
          setTurn(nextTurn);
          updateGameStatus(newBoard, nextTurn);
        }
      }, 500); // 500ms delay for realism
      return () => clearTimeout(timeout);
    }
  }, [board, turn, gameMode, playerColor, difficulty, overlayMessage, updateGameStatus]);

  const handleSquareClick = (r: number, c: number) => {
    if (overlayMessage) return; // Game over or resigned
    if (gameMode === "PvAI" && turn !== playerColor) return; // Not player's turn

    // Determine if clicking a valid move target
    const targetMove = validMoves.find(m => m.to.r === r && m.to.c === c);
    if (targetMove && selectedPos) {
      // Execute Move
      const newBoard = applyMove(board, targetMove);
      setBoard(newBoard);
      setSelectedPos(null);
      setValidMoves([]);
      const nextTurn = turn === "w" ? "b" : "w";
      setTurn(nextTurn);
      updateGameStatus(newBoard, nextTurn);
      return;
    }

    // Select piece
    const piece = board[r][c];
    if (piece && piece.color === turn) {
      setSelectedPos({ r, c });
      // Only show valid moves for THIS selected piece
      const allMoves = getValidMoves(board, turn);
      setValidMoves(allMoves.filter(m => m.from.r === r && m.from.c === c));
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  // --- Button Controls ---
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
        setBoard(getInitialBoard());
        setTurn("w");
        setOverlayMessage(null);
        setSelectedPos(null);
        setValidMoves([]);
        updateGameStatus(getInitialBoard(), "w");
      }
    });
  };

  const handleSwapSide = () => {
    Swal.fire({
      title: "Swap Sides?",
      text: "You will restart playing as the other color.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
    }).then((result) => {
      if (result.isConfirmed) {
        setPlayerColor(playerColor === "w" ? "b" : "w");
        setBoard(getInitialBoard());
        setTurn("w");
        setOverlayMessage(null);
        setSelectedPos(null);
        setValidMoves([]);
        updateGameStatus(getInitialBoard(), "w");
      }
    });
  };

  // Render helpers
  const renderCaptured = (count: number, color: "w" | "b") => {
    const icon = color === "w" ? "⚪" : "⚫";
    return Array(count).fill(icon).join("");
  };

  // Board orientation logic
  const displayBoard = playerColor === "w" ? board : [...board].reverse().map(row => [...row].reverse());

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto relative font-sans">
      
      {/* Overlay Message */}
      {overlayMessage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
          <h1 className="text-4xl font-extrabold text-white animate-pulse text-center p-4">
            {overlayMessage}
          </h1>
        </div>
      )}

      {/* Top Status & Opponent Captures */}
      <div className="w-full flex justify-between items-end mb-2 px-2">
        <h2 className="text-xl font-bold text-gray-800">{gameStatus}</h2>
        <div className="text-sm tracking-tighter drop-shadow-md">
          {playerColor === "w" ? renderCaptured(capturedWhite, "w") : renderCaptured(capturedBlack, "b")}
        </div>
      </div>

      {/* The Checkers Board */}
      <div className="w-full aspect-square border-4 border-gray-800 rounded-lg overflow-hidden bg-amber-100 flex flex-col">
        {displayBoard.map((row, rIndex) => {
          const actualR = playerColor === "w" ? rIndex : 7 - rIndex;
          return (
            <div key={rIndex} className="flex-1 flex">
              {row.map((piece, cIndex) => {
                const actualC = playerColor === "w" ? cIndex : 7 - cIndex;
                const isDarkSquare = (actualR + actualC) % 2 === 1;
                const isSelected = selectedPos?.r === actualR && selectedPos?.c === actualC;
                const isMoveTarget = validMoves.some(m => m.to.r === actualR && m.to.c === actualC);

                return (
                  <div
                    key={cIndex}
                    onClick={() => handleSquareClick(actualR, actualC)}
                    className={`flex-1 flex items-center justify-center relative
                      ${isDarkSquare ? "bg-amber-800" : "bg-amber-200"}
                      ${isSelected ? "ring-inset ring-4 ring-yellow-400" : ""}
                    `}
                  >
                    {/* Move Highlight Dot */}
                    {isMoveTarget && <div className="absolute w-4 h-4 bg-yellow-400/70 rounded-full z-10" />}
                    
                    {/* The Piece */}
                    {piece && (
                      <div className={`w-[80%] h-[80%] rounded-full shadow-lg flex items-center justify-center border-[3px]
                        ${piece.color === "w" ? "bg-stone-200 border-stone-300" : "bg-gray-800 border-gray-900"}
                      `}>
                        {piece.isKing && <span className="text-yellow-500 font-bold text-lg md:text-2xl drop-shadow-md">♚</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Player Captures */}
      <div className="w-full flex justify-end mt-2 px-2 h-6">
         <div className="text-sm tracking-tighter drop-shadow-md">
          {playerColor === "w" ? renderCaptured(capturedBlack, "b") : renderCaptured(capturedWhite, "w")}
        </div>
      </div>

      {/* Controls Section (Exact same structure as Chess) */}
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
            setBoard(getInitialBoard());
            setTurn("w");
            setOverlayMessage(null);
            updateGameStatus(getInitialBoard(), "w");
          }}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded shadow transition-colors"
        >
          {gameMode === "PvAI" ? "Switch to Player vs Player" : "Switch to Player vs AI"}
        </button>
      </div>
    </div>
  );
}