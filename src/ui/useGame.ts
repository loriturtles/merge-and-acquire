import { useEffect, useReducer, useRef } from 'react';
import { economy } from '../config/economy';
import { deserialise, load, save, SAVE_KEY, serialise } from '../game/save';
import { newGame, reducer } from '../game/state';
import { backupSave, hapticFor, isNative, restoreSave } from '../native';

/** 8 rows only when the screen is tall enough that cells stay close to their width-limited size. */
function rowsForScreen(): number {
  const { cols, rows, tallRows } = economy.board;
  const pad = 16;
  const gap = 4;
  const nonBoard = window.innerHeight > 760 ? 452 : 375; // measured height of everything else (see index.css)
  const cellByWidth = (Math.min(window.innerWidth, 430) - 32 - pad - gap * (cols - 1)) / cols;
  const cellByHeight = (window.innerHeight - nonBoard - pad - gap * (tallRows - 1)) / tallRows;
  return cellByHeight >= cellByWidth * 0.9 ? tallRows : rows;
}

// `?save=name` keeps a separate save slot, handy for testing several phones at once.
const slot = new URLSearchParams(window.location.search).get('save');
const saveKey = slot ? `${SAVE_KEY}:${slot}` : SAVE_KEY;

function init() {
  const now = Date.now();
  return load(localStorage, now, saveKey) ?? newGame({ now, rows: rowsForScreen(), seed: (Math.random() * 2 ** 31) | 0 });
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  // One clock for hours refill, payday and countdowns.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') dispatch({ type: 'tick', now: Date.now() });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => save(localStorage, state, saveKey), [state]);

  // Haptics for merges, deliveries and the like (iOS app only).
  useEffect(() => {
    if (state.event) hapticFor(state.event);
  }, [state.event]);

  // iOS app: keep a durable copy of the save, and restore it if the web view's storage was cleared.
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  useEffect(() => {
    if (!isNative) return;
    void restoreSave(saveKey).then((raw) => {
      const backup = deserialise(raw, Date.now());
      const current = latest.current;
      // Only restore when the backup is further along, i.e. local storage was wiped.
      if (backup && (backup.level > current.level || backup.stats.ordersTotal > current.stats.ordersTotal)) {
        dispatch({ type: 'reset', state: backup });
      }
    });
    const backup = () => void backupSave(saveKey, serialise(latest.current));
    const id = setInterval(backup, 15_000);
    const onHide = () => document.visibilityState === 'hidden' && backup();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  // Dev only: `__game.set({ hours: 0 })` in the console to jump around while testing.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __game: unknown }).__game = {
      state,
      set: (patch: Partial<typeof state>) => dispatch({ type: 'reset', state: { ...state, ...patch } }),
    };
  }, [state]);

  return [state, dispatch] as const;
}
