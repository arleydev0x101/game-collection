// app/utils/checkers.ts

export type PieceColor = "w" | "b";
export type Piece = { color: PieceColor; isKing: boolean } | null;
export type Board = Piece[][];
export type Position = { r: number; c: number };
export type Move = { from: Position; to: Position; jump?: Position };

export const getInitialBoard = (): Board => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) board[r][c] = { color: "b", isKing: false }; 
        if (r > 4) board[r][c] = { color: "w", isKing: false }; 
      }
    }
  }
  return board;
};

// UPDATED: Now accepts `mustJumpPos` to force a double-jump sequence
export const getValidMoves = (board: Board, turn: PieceColor, mustJumpPos?: Position | null): Move[] => {
  const moves: Move[] = [];
  const jumps: Move[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      // If we are locked into a multi-jump, ignore all other pieces
      if (mustJumpPos && (r !== mustJumpPos.r || c !== mustJumpPos.c)) continue;

      const piece = board[r][c];
      if (!piece || piece.color !== turn) continue;

      const dirs = piece.isKing ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : piece.color === "b" ? [[1, 1], [1, -1]] : [[-1, 1], [-1, -1]];

      for (let [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          if (!board[nr][nc]) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          } else if (board[nr][nc]?.color !== turn) {
            const jr = nr + dr, jc = nc + dc;
            if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !board[jr][jc]) {
              jumps.push({ from: { r, c }, to: { r: jr, c: jc }, jump: { r: nr, c: nc } });
            }
          }
        }
      }
    }
  }
  // If locked into a mustJumpPos, standard moves are illegal, only return jumps.
  return jumps.length > 0 ? jumps : (mustJumpPos ? [] : moves); 
};

export const applyMove = (board: Board, move: Move): Board => {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[move.from.r][move.from.c]!;
  
  newBoard[move.to.r][move.to.c] = piece;
  newBoard[move.from.r][move.from.c] = null;
  
  if (move.jump) newBoard[move.jump.r][move.jump.c] = null;

  if (piece.color === "w" && move.to.r === 0) newBoard[move.to.r][move.to.c] = { ...piece, isKing: true };
  if (piece.color === "b" && move.to.r === 7) newBoard[move.to.r][move.to.c] = { ...piece, isKing: true };

  return newBoard;
};

const evaluate = (board: Board, color: PieceColor) => {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        const val = p.isKing ? 3 : 1;
        score += p.color === color ? val : -val;
      }
    }
  }
  return score;
};

const minimax = (board: Board, depth: number, alpha: number, beta: number, isMax: boolean, color: PieceColor): number => {
  const moves = getValidMoves(board, isMax ? color : (color === "w" ? "b" : "w"));
  if (depth === 0 || moves.length === 0) return evaluate(board, color);

  if (isMax) {
    let maxEval = -Infinity;
    for (let move of moves) {
      const evalNode = minimax(applyMove(board, move), depth - 1, alpha, beta, false, color);
      maxEval = Math.max(maxEval, evalNode);
      alpha = Math.max(alpha, evalNode);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let move of moves) {
      const evalNode = minimax(applyMove(board, move), depth - 1, alpha, beta, true, color);
      minEval = Math.min(minEval, evalNode);
      beta = Math.min(beta, evalNode);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

// UPDATED: AI now passes mustJumpPos to properly handle its own multi-jumps
export const getBestCheckersMove = (board: Board, turn: PieceColor, difficulty: string, mustJumpPos?: Position | null): Move | null => {
  const moves = getValidMoves(board, turn, mustJumpPos);
  if (moves.length === 0) return null;

  if (difficulty === "Easy") return moves[Math.floor(Math.random() * moves.length)];
  
  if (difficulty === "Intermediate") {
    const jumps = moves.filter(m => m.jump);
    if (jumps.length > 0) return jumps[Math.floor(Math.random() * jumps.length)];
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = difficulty === "Expert" ? 5 : 3;
  let bestMove = moves[0];
  let bestVal = -Infinity;

  for (let move of moves) {
    const val = minimax(applyMove(board, move), depth - 1, -Infinity, Infinity, false, turn);
    if (val > bestVal) {
      bestVal = val;
      bestMove = move;
    }
  }
  return bestMove;
};