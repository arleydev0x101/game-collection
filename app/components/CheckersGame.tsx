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
  
  // NEW: State to track if a player is in the middle of a double jump
  const [mustJumpPos, setMustJumpPos] = useState<Position | null>(null);

  const [capturedWhite, setCapturedWhite] = useState<number>(0);
  const [capturedBlack, setCapturedBlack] = useState<number>(0);

  const updateGameStatus = useCallback((currentBoard: Board, currentTurn: PieceColor, isMultiJump: boolean = false) => {
    const moves = getValidMoves(currentBoard, currentTurn);
    if (moves.length === 0) {
      const winner = currentTurn === "w" ? "Black" : "White";
      setGameStatus(`${winner} Wins!`);
      setOverlayMessage(`${winner} Wins! 🏆`);
    } else if (isMultiJump) {
      setGameStatus(`Double Jump! ${currentTurn === "w" ? "White" : "Black"} goes again!`);
    } else {
      setGameStatus(`${currentTurn === "w" ? "White" : "Black"}'s Turn`);
    }

    let wCount = 0;
    let bCount = 0;
    currentBoard.forEach(row => row.forEach(p => {
      if (p?.color === 'w') wCount++;
      if (p?.color === 'b') bCount++;
    }));
    setCapturedWhite(12 - wCount); 
    setCapturedBlack(12 - bCount);
  }, []);

  // NEW: Centralized move execution for both Player and AI to check for multi-jumps
  const executeMove = useCallback((move: Move) => {
    const oldPiece = board[move.from.r][move.from.c];
    const newBoard = applyMove(board, move);
    const newPiece = newBoard[move.to.r][move.to.c];
    
    // According to US rules, if a piece is promoted to King, its turn immediately ends.
    const promoted = !oldPiece?.isKing && newPiece?.isKing;
    
    let canJumpAgain = false;
    // Check if the move was a jump and the piece didn't just promote
    if (move.jump && !promoted) {
      const followUpMoves = getValidMoves(newBoard, turn, move.to);
      if (followUpMoves.length > 0 && followUpMoves[0].jump) {
        canJumpAgain = true;
      }
    }

    setBoard(newBoard);

    if (canJumpAgain) {
      // Keep turn, lock player into this specific piece
      setMustJumpPos(move.to);
      setSelectedPos(move.to);
      setValidMoves(getValidMoves(newBoard, turn, move.to));
      updateGameStatus(newBoard, turn, true);
    } else {
      // End turn
      setMustJumpPos(null);
      setSelectedPos(null);
      setValidMoves([]);
      const nextTurn = turn === "w" ? "b" : "w";
      setTurn(nextTurn);
      updateGameStatus(newBoard, nextTurn, false);
    }
  }, [board, turn, updateGameStatus]);

  // AI Turn Handling
  useEffect(() => {
    if (gameMode === "PvAI" && turn !== playerColor && !overlayMessage) {
      const timeout = setTimeout(() => {
        // AI now considers the `mustJumpPos` lock
        const move = getBestCheckersMove(board, turn, difficulty, mustJumpPos);
        if (move) {
          executeMove(move);
        }
      }, 600); 
      return () => clearTimeout(timeout);
    }
  }, [board, turn, gameMode, playerColor, difficulty, overlayMessage, mustJumpPos, executeMove]);

  const handleSquareClick = (r: number, c: number) => {
    if (overlayMessage) return; 
    if (gameMode === "PvAI" && turn !== playerColor) return; 

    const targetMove = validMoves.find(m => m.to.r === r && m.to.c === c);
    if (targetMove && selectedPos) {
      executeMove(targetMove);
      return;
    }

    // NEW: If the player is locked into a double jump, prevent selecting other pieces
    if (mustJumpPos) {
      if (r === mustJumpPos.r && c === mustJumpPos.c) {
        setSelectedPos({ r, c });
        setValidMoves(getValidMoves(board, turn, mustJumpPos));
      }
      return;
    }

    const piece = board[r][c];
    if (piece && piece.color === turn) {
      setSelectedPos({ r, c });
      const allMoves = getValidMoves(board, turn);
      setValidMoves(allMoves.filter(m => m.from.r === r && m.from.c === c));
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  const resetGame = (newColor: PieceColor = "w", swap: boolean = false) => {
    setBoard(getInitialBoard());
    setTurn("w");
    setOverlayMessage(null);
    setSelectedPos(null);
    setValidMoves([]);
    setMustJumpPos(null);
    if (swap) setPlayerColor(newColor);
    updateGameStatus(getInitialBoard(), "w");
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
      if (result.isConfirmed) resetGame(playerColor);
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
      if (result.isConfirmed) resetGame(playerColor === "w" ? "b" : "w", true);
    });
  };

  const renderCaptured = (count: number, color: "w" | "b") => {
    const icon = color === "w" ? "⚪" : "⚫";
    return Array(count).fill(icon).join("");
  };

  const displayBoard = playerColor === "w" ? board : [...board].reverse().map(row => [...row].reverse());

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto relative font-sans">
      
      {/* Top Status & Opponent Captures */}
      <div className="w-full flex justify-between items-end mb-2 px-2">
        <h2 className={`text-xl font-bold ${mustJumpPos ? "text-blue-600 animate-pulse" : "text-gray-800"}`}>
          {gameStatus}
        </h2>
        <div className="text-sm tracking-tighter drop-shadow-md">
          {playerColor === "w" ? renderCaptured(capturedWhite, "w") : renderCaptured(capturedBlack, "b")}
        </div>
      </div>

      {/* The Checkers Board */}
      <div className="w-full aspect-square border-4 border-gray-800 rounded-lg overflow-hidden bg-amber-100 flex flex-col relative">
        
        {overlayMessage && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white animate-pulse text-center p-4 drop-shadow-lg">
              {overlayMessage}
            </h1>
          </div>
        )}

        {displayBoard.map((row, rIndex) => {
          const actualR = playerColor === "w" ? rIndex : 7 - rIndex;
          return (
            <div key={rIndex} className="flex-1 flex">
              {row.map((piece, cIndex) => {
                const actualC = playerColor === "w" ? cIndex : 7 - cIndex;
                const isDarkSquare = (actualR + actualC) % 2 === 1;
                const isSelected = selectedPos?.r === actualR && selectedPos?.c === actualC;
                const isMoveTarget = validMoves.some(m => m.to.r === actualR && m.to.c === actualC);
                // Pulse the specific piece if it is forced to do a double jump
                const isForcedJump = mustJumpPos?.r === actualR && mustJumpPos?.c === actualC;

                return (
                  <div
                    key={cIndex}
                    onClick={() => handleSquareClick(actualR, actualC)}
                    className={`flex-1 flex items-center justify-center relative transition-colors duration-300
                      ${isDarkSquare ? "bg-amber-800" : "bg-amber-200"}
                      ${isSelected ? "ring-inset ring-4 ring-yellow-400" : ""}
                    `}
                  >
                    {isMoveTarget && <div className="absolute w-4 h-4 bg-yellow-400/80 rounded-full z-10" />}
                    
                    {piece && (
                      <div className={`w-[80%] h-[80%] rounded-full shadow-lg flex items-center justify-center border-[3px] transition-transform
                        ${piece.color === "w" ? "bg-stone-200 border-stone-300" : "bg-gray-800 border-gray-900"}
                        ${isForcedJump ? "animate-bounce ring-4 ring-blue-500 ring-offset-2 ring-offset-amber-800" : ""}
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

      <div className="w-full flex justify-end mt-2 px-2 h-6">
         <div className="text-sm tracking-tighter drop-shadow-md">
          {playerColor === "w" ? renderCaptured(capturedBlack, "b") : renderCaptured(capturedWhite, "w")}
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
            resetGame("w");
          }}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded shadow transition-colors"
        >
          {gameMode === "PvAI" ? "Switch to Player vs Player" : "Switch to Player vs AI"}
        </button>
      </div>
    </div>
  );
}