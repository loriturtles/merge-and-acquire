import type { ChainId } from '../content/chains';
import type { PathId, StageId } from '../content/paths';

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

export interface OrderItem {
  chain: ChainId;
  tier: number;
}

export interface Order {
  id: number;
  characterId: string;
  /** 1–3 distinct items, all needed to deliver. */
  items: OrderItem[];
  text: string;
  reward: number;
  postedAt: number;
}

/** A line in #team-requests. `from` is a character id, or 'you'. */
export interface ChatMessage {
  id: number;
  from: string;
  text: string;
  at: number;
  /** Set on request messages, so the chat can show whether it's still open. */
  orderId?: number;
  items?: OrderItem[];
}

/** Short-lived feedback the UI animates. Not important to keep across saves. */
export type GameEvent =
  | { type: 'spawn'; index: number; from: number; at: number }
  | { type: 'merge'; index: number; at: number }
  | { type: 'deliver'; orderId: number; amount: number; at: number }
  | { type: 'sell'; amount: number; at: number }
  | { type: 'payday'; amount: number; count: number; at: number }
  | { type: 'denied'; index: number; reason: 'no-hours' | 'board-full' | 'no-shares' | 'no-salary'; at: number }
  | { type: 'paged'; index: number; at: number }
  | { type: 'burnout'; at: number }
  | { type: 'overtime'; at: number }
  | { type: 'vested'; amount: number; at: number }
  | { type: 'bought'; taskId: string; at: number }
  | { type: 'upgraded'; index: number; at: number }
  | { type: 'refilled'; at: number };

/** Unvested shares: visible but not spendable until `vestAt`. */
export interface Grant {
  amount: number;
  vestAt: number;
  reason: string;
}

/** Big moments that need a card on screen, shown one at a time until dismissed. */
export type Notice =
  | { type: 'promotion'; from: string; to: string; oldPay: number; newPay: number; shares: number }
  | { type: 'review'; stage: StageId; rating: string; line: string; ordersFilled: number; target: number; shares: number }
  | { type: 'choose-path' }
  | { type: 'new-chapter'; stage: StageId }
  | { type: 'space-done'; spaceId: string; shares: number };

export interface GameState {
  version: 3;
  stage: StageId;
  /** Chosen after Uni. */
  path: PathId | null;
  titleIndex: number;
  /** XP towards the next title. */
  xp: number;
  /** Total levels gained, across all chapters (Lv in the header). */
  level: number;
  /** Generators waiting for a free cell after a new chapter unlocked them. */
  pendingGenerators: ChainId[];
  board: Board;
  selected: number | null;

  /** Negative while working overtime. */
  hours: number;
  /** When the current refill interval started. */
  hoursAnchor: number;
  /** Times of overtime hours worked, for the rolling 24h burnout check. */
  overtimeLog: number[];
  burntOutUntil: number;

  salary: number;
  /** Vested, spendable shares. */
  shares: number;
  vesting: Grant[];
  nextPaydayAt: number;
  /** Engineer path: when the pager next drops a bug. */
  nextPageAt: number;

  /** Engagement survey: open until `surveyEndsAt` (0 when none), then a mood boost until `moodUntil`. */
  surveyEndsAt: number;
  nextSurveyAt: number;
  moodUntil: number;

  /** Completed rebuild tasks per space id. */
  office: Record<string, string[]>;

  stats: {
    /** Orders filled in the current chapter, for the performance review. */
    ordersThisChapter: number;
    ordersTotal: number;
    /** Deliveries per character id. */
    deliveredTo: Record<string, number>;
  };
  /** Chapters whose performance review has happened. */
  reviewed: StageId[];
  notices: Notice[];

  orders: Order[];
  nextOrderId: number;

  chat: ChatMessage[];
  nextMessageId: number;
  /** Messages after this time count as new. */
  chatReadAt: number;

  rngSeed: number;

  /** Last time the state was brought up to date. */
  updatedAt: number;
  event: GameEvent | null;
}
