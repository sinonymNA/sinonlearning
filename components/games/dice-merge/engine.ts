export const BOARD_SIZE = 5;
export const MAX_TIER = 7;

export type Tier = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Board = Array<Array<Tier | null>>;
export type Orientation = "horizontal" | "vertical";

export interface Piece {
  id: string;
  dice: [Tier] | [Tier, Tier];
  orientation: Orientation;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface MergeResult {
  board: Board;
  score: number;
  waves: number;
  cleared: CellPosition[];
  created: Array<CellPosition & { tier: Tier }>;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array<Tier | null>(BOARD_SIZE).fill(null));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function rotatePiece(piece: Piece): Piece {
  if (piece.dice.length === 1) return piece;
  return {
    ...piece,
    orientation: piece.orientation === "horizontal" ? "vertical" : "horizontal",
  };
}

export function pieceCells(piece: Piece, anchor: CellPosition): CellPosition[] {
  const cells = [anchor];
  if (piece.dice.length === 2) {
    cells.push({
      row: anchor.row + (piece.orientation === "vertical" ? 1 : 0),
      col: anchor.col + (piece.orientation === "horizontal" ? 1 : 0),
    });
  }
  return cells;
}

export function canPlace(board: Board, piece: Piece, anchor: CellPosition): boolean {
  return pieceCells(piece, anchor).every(
    ({ row, col }) =>
      row >= 0 &&
      row < BOARD_SIZE &&
      col >= 0 &&
      col < BOARD_SIZE &&
      board[row][col] === null,
  );
}

export function placePiece(board: Board, piece: Piece, anchor: CellPosition): Board {
  if (!canPlace(board, piece, anchor)) return board;
  const next = cloneBoard(board);
  pieceCells(piece, anchor).forEach(({ row, col }, index) => {
    next[row][col] = piece.dice[index];
  });
  return next;
}

export function canFitAnywhere(board: Board, piece: Piece): boolean {
  const orientations: Orientation[] = piece.dice.length === 1 ? ["horizontal"] : ["horizontal", "vertical"];
  return orientations.some((orientation) => {
    const candidate = { ...piece, orientation };
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (canPlace(board, candidate, { row, col })) return true;
      }
    }
    return false;
  });
}

function neighbors({ row, col }: CellPosition): CellPosition[] {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].filter(({ row: nextRow, col: nextCol }) =>
    nextRow >= 0 && nextRow < BOARD_SIZE && nextCol >= 0 && nextCol < BOARD_SIZE,
  );
}

function findFirstMerge(board: Board): { tier: Tier; cells: CellPosition[] } | null {
  const visited = new Set<string>();
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const tier = board[row][col];
      const startKey = `${row}:${col}`;
      if (tier === null || visited.has(startKey)) continue;

      const cells: CellPosition[] = [];
      const queue = [{ row, col }];
      visited.add(startKey);
      while (queue.length > 0) {
        const current = queue.shift()!;
        cells.push(current);
        neighbors(current).forEach((next) => {
          const key = `${next.row}:${next.col}`;
          if (!visited.has(key) && board[next.row][next.col] === tier) {
            visited.add(key);
            queue.push(next);
          }
        });
      }
      if (cells.length >= 3) return { tier, cells };
    }
  }
  return null;
}

function pickMergeTarget(cells: CellPosition[], preferred?: CellPosition): CellPosition {
  if (preferred && cells.some((cell) => cell.row === preferred.row && cell.col === preferred.col)) {
    return preferred;
  }
  return [...cells].sort((a, b) => b.row - a.row || b.col - a.col)[0];
}

export function resolveMerges(board: Board, preferred?: CellPosition): MergeResult {
  const next = cloneBoard(board);
  const cleared = new Map<string, CellPosition>();
  const created: Array<CellPosition & { tier: Tier }> = [];
  let score = 0;
  let waves = 0;
  let match = findFirstMerge(next);

  while (match) {
    waves += 1;
    const waveMultiplier = 1 + (waves - 1) * 0.5;
    const target = pickMergeTarget(match.cells, preferred);
    match.cells.forEach((cell) => {
      next[cell.row][cell.col] = null;
      cleared.set(`${cell.row}:${cell.col}`, cell);
    });

    if (match.tier === MAX_TIER) {
      const blast = new Set<string>();
      match.cells.forEach(({ row, col }) => {
        for (let blastRow = row - 1; blastRow <= row + 1; blastRow += 1) {
          for (let blastCol = col - 1; blastCol <= col + 1; blastCol += 1) {
            if (blastRow >= 0 && blastRow < BOARD_SIZE && blastCol >= 0 && blastCol < BOARD_SIZE) {
              blast.add(`${blastRow}:${blastCol}`);
            }
          }
        }
      });
      blast.forEach((key) => {
        const [row, col] = key.split(":").map(Number);
        if (next[row][col] !== null) {
          next[row][col] = null;
          cleared.set(key, { row, col });
          score += 75 * waveMultiplier;
        }
      });
      score += match.cells.length * 180 * waveMultiplier;
    } else {
      const upgraded = (match.tier + 1) as Tier;
      next[target.row][target.col] = upgraded;
      created.push({ ...target, tier: upgraded });
      score += match.tier * match.cells.length * 30 * waveMultiplier;
    }

    preferred = target;
    match = findFirstMerge(next);
  }

  return {
    board: next,
    score: Math.round(score),
    waves,
    cleared: [...cleared.values()],
    created,
  };
}

function exposedTiers(board: Board): Tier[] {
  const values = new Set<Tier>();
  board.forEach((row, rowIndex) => {
    row.forEach((tier, colIndex) => {
      if (tier === null || tier >= MAX_TIER) return;
      if (neighbors({ row: rowIndex, col: colIndex }).some(({ row, col }) => board[row][col] === null)) {
        values.add(tier);
      }
    });
  });
  return [...values];
}

function randomTier(board: Board): Tier {
  const helpful = exposedTiers(board);
  if (helpful.length > 0 && Math.random() < 0.48) {
    return helpful[Math.floor(Math.random() * helpful.length)];
  }
  const roll = Math.random();
  if (roll < 0.5) return 1;
  if (roll < 0.8) return 2;
  if (roll < 0.95) return 3;
  return 4;
}

export function generatePiece(board: Board): Piece {
  const occupied = board.flat().filter(Boolean).length;
  const singleChance = occupied >= 19 ? 0.7 : occupied >= 14 ? 0.42 : 0.25;

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const single = Math.random() < singleChance;
    const piece: Piece = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      dice: single ? [randomTier(board)] : [randomTier(board), randomTier(board)],
      orientation: "horizontal",
    };
    if (canFitAnywhere(board, piece)) return piece;
  }

  for (let tier = 1; tier <= 4; tier += 1) {
    const rescue: Piece = { id: `rescue-${Date.now()}-${tier}`, dice: [tier as Tier], orientation: "horizontal" };
    if (canFitAnywhere(board, rescue)) return rescue;
  }

  return { id: `final-${Date.now()}`, dice: [1], orientation: "horizontal" };
}

