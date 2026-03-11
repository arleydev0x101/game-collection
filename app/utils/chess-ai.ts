// app/utils/chess-ai.ts
import { Chess } from "chess.js";

// Piece values for our basic evaluation
const pieceValues: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

const evaluateBoard = (game: Chess, color: 'w' | 'b') => {
  let value = 0;
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const val = pieceValues[piece.type];
        value += piece.color === color ? val : -val;
      }
    }
  }
  return value;
};

// Minimax algorithm with basic alpha-beta pruning
const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean, color: 'w' | 'b'): number => {
  if (depth === 0 || game.isGameOver()) return evaluateBoard(game, color);

  const moves = game.moves();
  if (isMaximizing) {
    let bestVal = -Infinity;
    for (let move of moves) {
      game.move(move);
      bestVal = Math.max(bestVal, minimax(game, depth - 1, alpha, beta, !isMaximizing, color));
      game.undo();
      alpha = Math.max(alpha, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  } else {
    let bestVal = Infinity;
    for (let move of moves) {
      game.move(move);
      bestVal = Math.min(bestVal, minimax(game, depth - 1, alpha, beta, !isMaximizing, color));
      game.undo();
      beta = Math.min(beta, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  }
};

export const getBestMove = (game: Chess, difficulty: string): string => {
  const moves = game.moves();
  if (moves.length === 0) return "";

  // Easy: Completely Random
  if (difficulty === "Easy") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Intermediate: Grab free pieces if possible, otherwise random
  if (difficulty === "Intermediate") {
    const capturingMoves = moves.filter(m => m.includes('x'));
    if (capturingMoves.length > 0) return capturingMoves[Math.floor(Math.random() * capturingMoves.length)];
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Hard (Depth 2) & Expert (Depth 3)
  const depth = difficulty === "Expert" ? 3 : 2;
  const aiColor = game.turn();
  
  let bestMove = moves[0];
  let bestValue = -Infinity;

  for (let move of moves) {
    game.move(move);
    const boardValue = minimax(game, depth - 1, -Infinity, Infinity, false, aiColor);
    game.undo();
    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  return bestMove;
};