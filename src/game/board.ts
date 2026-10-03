import { maxTierOf, type ChainId } from '../content/chains';
import type { Board, Cell, ItemPiece } from './types';

export function emptyBoard(cols: number, rows: number): Board {
  return { cols, rows, cells: Array<Cell>(cols * rows).fill(null) };
}

export function toXY(board: Board, index: number): [number, number] {
  return [index % board.cols, Math.floor(index / board.cols)];
}

/** Nearest empty cell to `origin` (by distance, ties broken by reading order), or -1 if full. */
export function nearestEmpty(board: Board, origin: number): number {
  const [ox, oy] = toXY(board, origin);
  let best = -1;
  let bestDist = Infinity;
  board.cells.forEach((cell, i) => {
    if (cell) return;
    const [x, y] = toXY(board, i);
    const d = (x - ox) ** 2 + (y - oy) ** 2;
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  });
  return best;
}

export function canMerge(a: Cell, b: Cell): boolean {
  return (
    a?.kind === 'item' &&
    b?.kind === 'item' &&
    a.chain === b.chain &&
    a.tier === b.tier &&
    a.tier < maxTierOf(a.chain)
  );
}

export type DropResult = 'none' | 'move' | 'merge' | 'swap';

/** Drops the piece at `from` onto `to`: merge if identical, move if empty, otherwise swap. */
export function drop(board: Board, from: number, to: number): { board: Board; result: DropResult } {
  const a = board.cells[from];
  const b = board.cells[to];
  if (from === to || !a) return { board, result: 'none' };

  const cells = board.cells.slice();
  let result: DropResult;
  if (canMerge(a, b)) {
    const item = a as ItemPiece;
    cells[to] = { kind: 'item', chain: item.chain, tier: item.tier + 1 };
    cells[from] = null;
    result = 'merge';
  } else if (!b) {
    cells[to] = a;
    cells[from] = null;
    result = 'move';
  } else {
    cells[to] = a;
    cells[from] = b;
    result = 'swap';
  }
  return { board: { ...board, cells }, result };
}

export function place(board: Board, index: number, cell: Cell): Board {
  const cells = board.cells.slice();
  cells[index] = cell;
  return { ...board, cells };
}

/** Index of an item matching chain and tier, preferring `prefer` if it matches. -1 if none. */
export function findItem(board: Board, chain: ChainId, tier: number, prefer?: number | null): number {
  const matches = (c: Cell) => c?.kind === 'item' && c.chain === chain && c.tier === tier;
  if (prefer != null && matches(board.cells[prefer])) return prefer;
  return board.cells.findIndex(matches);
}

/** Highest tier on the board for each chain (0 if none). */
export function bestTiers(board: Board): Map<ChainId, number> {
  const best = new Map<ChainId, number>();
  for (const c of board.cells) {
    if (c?.kind === 'item') best.set(c.chain, Math.max(best.get(c.chain) ?? 0, c.tier));
  }
  return best;
}
