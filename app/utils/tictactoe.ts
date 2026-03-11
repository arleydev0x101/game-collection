// app/utils/tictactoe.ts

export type Player = "X" | "O" | null;
export type Board = Player[];

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export const checkWinner = (board: Board): "X" | "O" | "Draw" | null => {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const [a, b, c] = WIN_LINES[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as "X" | "O";
    }
  }
  if (!board.includes(null)) return "Draw";
  return null;
};

// Minimax Algorithm for unbeatable AI
const minimax = (board: Board, depth: number, isMaximizing: boolean, aiPlayer: "X" | "O", humanPlayer: "X" | "O"): number => {
  const result = checkWinner(board);
  if (result === aiPlayer) return 10 - depth;
  if (result === humanPlayer) return depth - 10;
  if (result === "Draw") return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = aiPlayer;
        let score = minimax(board, depth + 1, false, aiPlayer, humanPlayer);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = humanPlayer;
        let score = minimax(board, depth + 1, true, aiPlayer, humanPlayer);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
};

export const getBestTicTacToeMove = (board: Board, aiPlayer: "X" | "O", difficulty: string): number => {
  const availableMoves = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
  const humanPlayer = aiPlayer === "X" ? "O" : "X";

  // Easy: Completely Random
  if (difficulty === "Easy") {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Intermediate: Take win if available, block loss if imminent, otherwise random
  if (difficulty === "Intermediate") {
    // 1. Check for immediate win
    for (let move of availableMoves) {
      const boardCopy = [...board];
      boardCopy[move] = aiPlayer;
      if (checkWinner(boardCopy) === aiPlayer) return move;
    }
    // 2. Check for immediate block
    for (let move of availableMoves) {
      const boardCopy = [...board];
      boardCopy[move] = humanPlayer;
      if (checkWinner(boardCopy) === humanPlayer) return move;
    }
    // 3. Random
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Hard & Expert: Minimax (Unbeatable)
  // To make "Hard" slightly different than "Expert", we could add a 10% chance to make a random move, 
  // but standard Tic-Tac-Toe AI usually defaults to full Minimax for high difficulties.
  let bestScore = -Infinity;
  let move = availableMoves[0];

  // If difficulty is Hard, occasionally make a sub-optimal move (15% chance)
  if (difficulty === "Hard" && Math.random() < 0.15) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  for (let i = 0; i < availableMoves.length; i++) {
    const idx = availableMoves[i];
    board[idx] = aiPlayer;
    let score = minimax(board, 0, false, aiPlayer, humanPlayer);
    board[idx] = null;
    if (score > bestScore) {
      bestScore = score;
      move = idx;
    }
  }
  return move;
};