import { economy } from '../config/economy';
import { getChapter } from '../content/chapters';
import { annualSalary } from '../content/salaries';
import type { ChainId } from '../content/chains';
import { characters, deliverLines, linesForRole, thanksLines } from '../content/characters';
import { drop, emptyBoard, nearestEmpty, place } from './board';
import { refillHours, spendHours } from './hours';
import { fillOrders, matchItems } from './orders';
import { collectPaydays } from './payday';
import { pick, pickWeighted } from './rng';
import type { ChatMessage, GameState, Order, Piece } from './types';

export type Action =
  | { type: 'tick'; now: number }
  | { type: 'tap'; index: number; now: number }
  | { type: 'drop'; from: number; to: number; now: number }
  | { type: 'deliver'; orderId: number; now: number }
  | { type: 'sell'; index: number; now: number }
  | { type: 'deselect' }
  | { type: 'readChat'; now: number }
  | { type: 'reset'; state: GameState };

export function newGame(opts: { now: number; rows: number; seed: number }): GameState {
  const { cols } = economy.board;
  const chapter = getChapter('uni');
  let board = emptyBoard(cols, opts.rows);
  const at = (x: number, y: number) => y * cols + x;
  const starting: [number, number, Piece][] = [
    [1, 2, { kind: 'generator', chain: 'study' }],
    [5, 2, { kind: 'generator', chain: 'food' }],
    [1, 3, { kind: 'item', chain: 'study', tier: 1 }],
    [2, 2, { kind: 'item', chain: 'study', tier: 1 }],
    [2, 3, { kind: 'item', chain: 'study', tier: 1 }],
    [5, 3, { kind: 'item', chain: 'food', tier: 1 }],
    [4, 2, { kind: 'item', chain: 'food', tier: 1 }],
  ];
  for (const [x, y, piece] of starting) board = place(board, at(x, y), piece);

  const base: GameState = {
    version: 2,
    chapterId: chapter.id,
    titleIndex: 0,
    board,
    selected: null,
    hours: economy.hours.cap,
    hoursAnchor: opts.now,
    salary: economy.start.salary,
    shares: economy.start.shares,
    nextPaydayAt: opts.now + economy.payday.everyMs,
    orders: [],
    nextOrderId: 1,
    chat: [],
    nextMessageId: 1,
    chatReadAt: 0,
    rngSeed: opts.seed,
    updatedAt: opts.now,
    event: null,
  };
  const { added, ...filled } = fillOrders(chapter, [], 1, opts.seed, opts.now);
  return post({ ...base, ...filled }, added.map(requestMessage));
}

type NewMessage = Omit<ChatMessage, 'id'>;

const requestMessage = (o: Order): NewMessage => ({ from: o.characterId, text: o.text, at: o.postedAt, orderId: o.id, items: o.items });

/** Appends messages to #team-requests, keeping the history short. */
function post(state: GameState, messages: NewMessage[]): GameState {
  let id = state.nextMessageId;
  const chat = [...state.chat, ...messages.map((m) => ({ ...m, id: id++ }))].slice(-economy.orders.chatHistory);
  return { ...state, chat, nextMessageId: id };
}

/** One paycheck at the current job title. */
export function wage(state: GameState): number {
  const chapter = getChapter(state.chapterId);
  const title = chapter.titles[Math.min(state.titleIndex, chapter.titles.length - 1)];
  return Math.round(annualSalary(title) / economy.payday.periodsPerYear);
}

/** Brings timers up to `now`: hours refill and paydays. Used every second and after time away. */
export function tick(state: GameState, now: number): GameState {
  const hours = refillHours(state, now);
  const pay = collectPaydays(state.nextPaydayAt, now);
  if (hours === state && pay.count === 0) return state.updatedAt === now ? state : { ...state, updatedAt: now };

  const amount = pay.count * wage(state);
  return {
    ...state,
    ...hours,
    salary: state.salary + amount,
    nextPaydayAt: pay.nextPaydayAt,
    updatedAt: now,
    event: pay.count ? { type: 'payday', amount, count: pay.count, at: now } : state.event,
  };
}

function spawn(state: GameState, index: number, chain: ChainId, now: number): GameState {
  const target = nearestEmpty(state.board, index);
  if (target === -1) return { ...state, event: { type: 'denied', index, reason: 'board-full', at: now } };

  const hours = spendHours(state, economy.hours.costPerTap, now);
  if (!hours) return { ...state, event: { type: 'denied', index, reason: 'no-hours', at: now } };

  const [t, rngSeed] = pickWeighted(state.rngSeed, getChapter(state.chapterId).generatorDrops);
  return {
    ...state,
    ...hours,
    rngSeed,
    board: place(state.board, target, { kind: 'item', chain, tier: t + 1 }),
    event: { type: 'spawn', index: target, from: index, at: now },
  };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'tick':
      return tick(state, action.now);

    case 'tap': {
      const s = tick(state, action.now);
      const cell = s.board.cells[action.index];
      if (cell?.kind === 'generator') return spawn({ ...s, selected: action.index }, action.index, cell.chain, action.now);
      return { ...s, selected: cell ? action.index : null };
    }

    case 'drop': {
      const { board, result } = drop(state.board, action.from, action.to);
      if (result === 'none') return state;
      return {
        ...state,
        board,
        selected: action.to,
        event: result === 'merge' ? { type: 'merge', index: action.to, at: action.now } : state.event,
      };
    }

    case 'deliver': {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order) return state;
      const cells = matchItems(state.board, order.items, state.selected);
      if (cells.includes(-1)) return state;

      const now = action.now;
      const remaining = state.orders.filter((o) => o.id !== order.id);
      const { added, rngSeed, ...refilled } = fillOrders(getChapter(state.chapterId), remaining, state.nextOrderId, state.rngSeed, now, [
        order.characterId,
      ]);
      const who = characters.find((c) => c.id === order.characterId);
      const [mine, s1] = pick(rngSeed, deliverLines);
      const [thanks, s2] = pick(s1, linesForRole(thanksLines, who?.role ?? 'flatmate'));

      const board = cells.reduce((b, i) => place(b, i, null), state.board);
      const delivered: GameState = {
        ...state,
        ...refilled,
        rngSeed: s2,
        board,
        selected: state.selected !== null && cells.includes(state.selected) ? null : state.selected,
        salary: state.salary + order.reward,
        event: { type: 'deliver', orderId: order.id, amount: order.reward, at: now },
      };
      return post(delivered, [
        { from: 'you', text: mine, at: now, items: order.items },
        { from: order.characterId, text: thanks.text, at: now },
        ...added.map(requestMessage),
      ]);
    }

    case 'sell': {
      const cell = state.board.cells[action.index];
      if (cell?.kind !== 'item') return state;
      const amount = economy.sellValue(cell.tier);
      return {
        ...state,
        board: place(state.board, action.index, null),
        selected: null,
        salary: state.salary + amount,
        event: { type: 'sell', amount, at: action.now },
      };
    }

    case 'readChat':
      return { ...state, chatReadAt: action.now };

    case 'deselect':
      return state.selected === null ? state : { ...state, selected: null };

    case 'reset':
      return action.state;
  }
}
