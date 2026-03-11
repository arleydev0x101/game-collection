// app/components/ChessGame.tsx
"use client";

import { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import Swal from "sweetalert2";
import { getBestMove } from "../utils/chess-ai";

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [gameMode, setGameMode] = useState<"PvAI" | "PvP">("PvAI");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [gameStatus, setGameStatus] = useState("White's Turn");
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);

  // NEW: State to track clicked squares and their highlight styles
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, { background: string; borderRadius?: string }>>({});

  useEffect(() => {
    if (overlayMessage?.includes("Resigned")) return;

    let newOverlay = null;

    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "Black" : "White";
      setGameStatus(`Checkmate! ${winner} wins.`);
      newOverlay = `Checkmate! ${winner} Wins! 🏆`;
    } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
      setGameStatus("Draw!");
      newOverlay = "Game ended in a Draw! 🤝";
    } else if (game.isCheck()) {
      setGameStatus("Check!");
    } else {
      setGameStatus(`${game.turn() === "w" ? "White" : "Black"}'s Turn`);
    }

    setOverlayMessage(newOverlay);

    const boardStr = game.board().flat().filter(Boolean);
    const startingCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentCounts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
    
    boardStr.forEach(p => { if (p && p.type !== 'k') currentCounts[p.color as 'w'|'b'][p.type as keyof typeof startingCounts]++; });
    
    const capWhite: string[] = []; 
    const capBlack: string[] = []; 

    (Object.keys(startingCounts) as Array<keyof typeof startingCounts>).forEach(piece => {
      const missingBlack = startingCounts[piece] - currentCounts.b[piece as keyof typeof startingCounts];
      const missingWhite = startingCounts[piece] - currentCounts.w[piece as keyof typeof startingCounts];
      for(let i=0; i<missingBlack; i++) capWhite.push(piece);
      for(let i=0; i<missingWhite; i++) capBlack.push(piece.toUpperCase());
    });

    setCapturedWhite(capWhite);
    setCapturedBlack(capBlack);
  }, [game]);

  useEffect(() => {
    if (gameMode === "PvAI" && !game.isGameOver() && !overlayMessage) {
      const isAITurn = (playerColor === "white" && game.turn() === "b") || (playerColor === "black" && game.turn() === "w");
      if (isAITurn) {
        const timeout = setTimeout(() => {
          const aiMove = getBestMove(game, difficulty);
          if (aiMove) {
            const gameCopy = new Chess(game.fen());
            gameCopy.move(aiMove);
            setGame(gameCopy);
          }
        }, 400); // Slight delay for AI "thinking" so animations look natural
        return () => clearTimeout(timeout);
      }
    }
  }, [game, gameMode, playerColor, difficulty, overlayMessage]);

  // NEW: Calculate valid moves and style the dots/capture rings
  function getMoveOptions(square: string) {
    const moves = game.moves({ square: square as Square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return;
    }

    const newSquares: Record<string, { background: string; borderRadius?: string }> = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to as Square) && game.get(move.to as Square)?.color !== game.get(square as Square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)" // Capture ring
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)", // Standard dot
        borderRadius: "50%",
      };
    });
    newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" }; // Highlight selected piece
    setOptionSquares(newSquares);
  }

  // NEW: Handle clicking on the board squares
  function onSquareClick(square: string) {
    if (overlayMessage) return;
    if (gameMode === "PvAI") {
      const isPlayerTurn = (playerColor === "white" && game.turn() === "w") || (playerColor === "black" && game.turn() === "b");
      if (!isPlayerTurn) return;
    }

    // Try to move if a piece is already selected
    if (moveFrom) {
      try {
        const gameCopy = new Chess(game.fen());
        const move = gameCopy.move({
          from: moveFrom,
          to: square,
          promotion: "q",
        });

        if (move) {
          setGame(gameCopy);
          setMoveFrom(null);
          setOptionSquares({});
          return;
        }
      } catch (e) {
        // Invalid move; fall through to see if they clicked a different piece
      }
    }

    // Select piece and show moves
    const piece = game.get(square as Square);
    if (piece && piece.color === game.turn()) {
      setMoveFrom(square);
      getMoveOptions(square);
    } else {
      setMoveFrom(null);
      setOptionSquares({});
    }
  }

  // Update onDrop to clear highlights when a piece is dragged and dropped
  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string, targetSquare: string | null }) {
    setMoveFrom(null);
    setOptionSquares({});

    if (overlayMessage || !targetSquare) return false; 
    
    if (gameMode === "PvAI") {
      const isPlayerTurn = (playerColor === "white" && game.turn() === "w") || (playerColor === "black" && game.turn() === "b");
      if (!isPlayerTurn) return false;
    }

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", 
      });

      if (move === null) return false;
      setGame(gameCopy);
      return true;
    } catch (e) {
      return false;
    }
  }

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
        setGame(new Chess());
        setOverlayMessage(null);
        setMoveFrom(null);
        setOptionSquares({});
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
        setPlayerColor(playerColor === "white" ? "black" : "white");
        setGame(new Chess());
        setOverlayMessage(null);
        setMoveFrom(null);
        setOptionSquares({});
      }
    });
  };

  const pieceMap: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕' };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto relative font-sans">
      
      <div className="w-full flex justify-between items-end mb-2 px-2">
        <h2 className={`text-xl font-bold ${gameStatus.includes("Check") ? "text-red-600" : "text-gray-800"}`}>
          {gameStatus}
        </h2>
        <div className="text-xl tracking-tighter text-gray-800 drop-shadow-md">
          {playerColor === "white" ? capturedBlack.map((p, i) => <span key={i}>{pieceMap[p]}</span>) : capturedWhite.map((p, i) => <span key={i}>{pieceMap[p]}</span>)}
        </div>
      </div>

      <div className="w-full aspect-square rounded-lg shadow-2xl overflow-hidden border-4 border-gray-800 bg-gray-300 relative">
        
        {overlayMessage && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white animate-pulse text-center p-4 drop-shadow-lg">
              {overlayMessage}
            </h1>
          </div>
        )}

        {/* UPDATED: Added onSquareClick, customSquareStyles, and bumped animation duration */}
        <Chessboard 
          options={{
            position: game.fen(),
            onPieceDrop: onDrop,
            onSquareClick: onSquareClick,
            boardOrientation: playerColor,
            darkSquareStyle: { backgroundColor: "#779556" },
            lightSquareStyle: { backgroundColor: "#ebecd0" },
            customSquareStyles: optionSquares,
            animationDurationInMs: 300, 
          }}
        />
      </div>

      <div className="w-full flex justify-end mt-2 px-2 h-8">
         <div className="text-xl tracking-tighter text-gray-800 drop-shadow-md">
          {playerColor === "white" ? capturedWhite.map((p, i) => <span key={i}>{pieceMap[p]}</span>) : capturedBlack.map((p, i) => <span key={i}>{pieceMap[p]}</span>)}
        </div>
      </div>

      <div className="w-full mt-4 space-y-3 relative z-30">
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
            setGame(new Chess());
            setOverlayMessage(null);
            setMoveFrom(null);
            setOptionSquares({});
          }}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded shadow transition-colors"
        >
          {gameMode === "PvAI" ? "Switch to Player vs Player" : "Switch to Player vs AI"}
        </button>
      </div>
    </div>
  );
}