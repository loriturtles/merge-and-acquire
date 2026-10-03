import type { ChainId } from '../content/chains';

export interface ItemPiece {
  kind: 'item';
  chain: ChainId;
  tier: number;
}

export interface GeneratorPiece {
  kind: 'generator';
  chain: ChainId;
}

export type Piece = ItemPiece | GeneratorPiece;
export type Cell = Piece | null;

export interface Board {
  cols: number;
  rows: number;
  /** Row-major, length cols × rows. */
  cells: Cell[];
}

export interface Order {
  id: number;
  characterId: string;
  chain: ChainId;
  tier: number;
  text: string;
  reward: number;
  postedAt: number;
}

/** Short-lived feedback the UI animates. Not important to keep across saves. */
export type GameEvent =
  | { type: 'spawn'; index: number; from: number; at: number }
  | { type: 'merge'; index: number; at: number }
  | { type: 'deliver'; orderId: number; amount: number; at: number }
  | { type: 'sell'; amount: number; at: number }
  | { type: 'payday'; amount: number; count: number; at: number }
  | { type: 'denied'; index: number; reason: 'no-hours' | 'board-full'; at: number };

export interface GameState {
  version: 1;
  chapterId: string;
  titleIndex: number;
  board: Board;
  selected: number | null;

  hours: number;
  /** When the current refill interval started. */
  hoursAnchor: number;

  salary: number;
  shares: number;
  nextPaydayAt: number;

  orders: Order[];
  nextOrderId: number;
  rngSeed: number;

  /** Last time the state was brought up to date. */
  updatedAt: number;
  event: GameEvent | null;
}
