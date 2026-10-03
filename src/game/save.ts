import { economy } from '../config/economy';
import { tick } from './state';
import type { GameState } from './types';

export const SAVE_KEY = 'merge-and-acquire/save';

/** Minimal storage interface so tests can pass a fake. */
export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function serialise(state: GameState): string {
  return JSON.stringify({ ...state, event: null });
}

/** Parses a save and catches it up to `now` (offline hours, paydays). Returns null if unusable. */
export function deserialise(raw: string | null, now: number): GameState | null {
  if (!raw) return null;
  try {
    const data = migrate(JSON.parse(raw));
    if (!data || !Array.isArray(data.board?.cells)) return null;
    return tick({ ...data, event: null }, now);
  } catch {
    return null;
  }
}

/** Upgrades older saves to the current shape. Returns null for anything unrecognised. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrate(data: any): GameState | null {
  if (data?.version === 1) {
    // v1 orders had a single chain/tier and there was no chat history.
    const orders = (data.orders ?? []).map(({ chain, tier, ...o }: { chain: string; tier: number }) => ({ ...o, items: [{ chain, tier }] }));
    const chat = orders.map((o: GameState['orders'][number], i: number) => ({
      id: i + 1, from: o.characterId, text: o.text, at: o.postedAt, orderId: o.id, items: o.items,
    }));
    data = { ...data, version: 2, orders, chat, nextMessageId: chat.length + 1, chatReadAt: 0 };
  }
  if (data?.version === 2) {
    // v2 was Uni-only: no path, XP, vesting, overtime, events or office.
    const { chapterId: _chapterId, ...rest } = data;
    data = {
      ...rest,
      version: 3,
      stage: 'uni',
      path: null,
      xp: 0,
      level: (data.titleIndex ?? 0) + 1,
      pendingGenerators: [],
      overtimeLog: [],
      burntOutUntil: 0,
      vesting: [],
      nextPageAt: 0,
      surveyEndsAt: 0,
      nextSurveyAt: (data.updatedAt ?? 0) + economy.survey.firstAfterMs,
      moodUntil: 0,
      office: {},
      stats: { ordersThisChapter: 0, ordersTotal: 0, deliveredTo: {} },
      reviewed: [],
      notices: [],
    };
  }
  return data?.version === 3 ? (data as GameState) : null;
}

export function load(storage: Storage, now: number, key = SAVE_KEY): GameState | null {
  try {
    return deserialise(storage.getItem(key), now);
  } catch {
    return null;
  }
}

export function save(storage: Storage, state: GameState, key = SAVE_KEY): void {
  try {
    storage.setItem(key, serialise(state));
  } catch {
    // Storage full or blocked (e.g. private mode). The game keeps running.
  }
}
