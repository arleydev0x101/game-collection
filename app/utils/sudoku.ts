// app/utils/sudoku.ts

export function generateSudoku() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  // Helper to check if a number is safe to place
  const isSafe = (board: number[][], row: number, col: number, num: number) => {
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num || board[x][col] === num) return false;
    }
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i + startRow][j + startCol] === num) return false;
      }
    }
    return true;
  };

  // Backtracking solver to fill the board completely
  const fillBoard = (board: number[][]) => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          // Shuffle numbers 1-9 for randomness
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (let num of nums) {
            if (isSafe(board, i, j, num)) {
              board[i][j] = num;
              if (fillBoard(board)) return true;
              board[i][j] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  fillBoard(board);
  const solution = JSON.parse(JSON.stringify(board)); // Keep a copy of the solution

  // Remove numbers to create the puzzle (adjust K for difficulty, 40 is a good medium)
  let k = 40; 
  while (k > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (board[row][col] !== 0) {
      board[row][col] = 0;
      k--;
    }
  }

  return { puzzle: board, solution };
}