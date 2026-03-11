// app/utils/tetris.ts

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export const TETROMINOES: Record<TetrominoType, { shape: number[][], color: string }> = {
  I: { shape: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]], color: 'bg-cyan-500' },
  J: { shape: [[0, 1, 0], [0, 1, 0], [1, 1, 0]], color: 'bg-blue-600' },
  L: { shape: [[0, 1, 0], [0, 1, 0], [0, 1, 1]], color: 'bg-orange-500' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: 'bg-green-500' },
  T: { shape: [[0, 0, 0], [1, 1, 1], [0, 1, 0]], color: 'bg-purple-500' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: 'bg-red-500' },
};

export const getRandomTetromino = () => {
  const keys = Object.keys(TETROMINOES) as TetrominoType[];
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return { type: randKey, ...TETROMINOES[randKey] };
};

export const createEmptyBoard = () =>
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));

export const rotatePiece = (matrix: number[][]) => {
  const N = matrix.length;
  const rotated = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - 1 - j][i])
  );
  return rotated;
};

export const checkCollision = (
  piece: { shape: number[][]; x: number; y: number },
  board: (string | null)[][]
) => {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardX = piece.x + x;
        const boardY = piece.y + y;
        // Check boundaries and existing blocks
        if (
          boardX < 0 || 
          boardX >= BOARD_WIDTH || 
          boardY >= BOARD_HEIGHT || 
          (boardY >= 0 && board[boardY][boardX] !== null)
        ) {
          return true;
        }
      }
    }
  }
  return false;
};