// app/utils/game2048.ts

export type Board = number[][];

export const getEmptyBoard = (): Board => Array(4).fill(null).map(() => Array(4).fill(0));

export const addRandomTile = (board: Board): Board => {
  const emptySpots: { r: number; c: number }[] = [];
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell === 0) emptySpots.push({ r, c });
    });
  });

  if (emptySpots.length === 0) return board;

  const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
  const newBoard = board.map((row) => [...row]);
  newBoard[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
};

// Helper to slide and merge a single row/column
const slideAndMerge = (line: number[]): { newLine: number[]; score: number } => {
  // 1. Remove zeros
  let filtered = line.filter((val) => val !== 0);
  let score = 0;

  // 2. Merge adjacent equals
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      score += filtered[i];
      filtered.splice(i + 1, 1);
    }
  }

  // 3. Pad with zeros back to length 4
  while (filtered.length < 4) {
    filtered.push(0);
  }

  return { newLine: filtered, score };
};

export const moveBoard = (board: Board, direction: "UP" | "DOWN" | "LEFT" | "RIGHT"): { newBoard: Board; scoreGained: number; moved: boolean } => {
  let newBoard = getEmptyBoard();
  let scoreGained = 0;
  let moved = false;

  for (let i = 0; i < 4; i++) {
    let line: number[] = [];
    
    // Extract the line based on direction
    if (direction === "LEFT" || direction === "RIGHT") {
      line = [...board[i]];
      if (direction === "RIGHT") line.reverse();
    } else {
      line = [board[0][i], board[1][i], board[2][i], board[3][i]];
      if (direction === "DOWN") line.reverse();
    }

    const { newLine, score } = slideAndMerge(line);
    scoreGained += score;

    // Put the line back
    if (direction === "RIGHT" || direction === "DOWN") newLine.reverse();

    for (let j = 0; j < 4; j++) {
      const val = direction === "LEFT" || direction === "RIGHT" ? newLine[j] : newLine[j];
      const targetR = direction === "LEFT" || direction === "RIGHT" ? i : j;
      const targetC = direction === "LEFT" || direction === "RIGHT" ? j : i;
      
      newBoard[targetR][targetC] = val;
      if (newBoard[targetR][targetC] !== board[targetR][targetC]) moved = true;
    }
  }

  return { newBoard, scoreGained, moved };
};

export const checkGameOver = (board: Board): boolean => {
  // Any empty spaces?
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return false;
    }
  }
  // Any adjacent merges possible?
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const current = board[r][c];
      if (
        (r < 3 && board[r + 1][c] === current) ||
        (c < 3 && board[r][c + 1] === current)
      ) {
        return false;
      }
    }
  }
  return true;
};