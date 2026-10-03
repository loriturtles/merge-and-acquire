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
    const data = JSON.parse(raw) as GameState;
    if (data?.version !== 1 || !Array.isArray(data.board?.cells)) return null;
    return tick({ ...data, event: null }, now);
  } catch {
    return null;
  }
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
