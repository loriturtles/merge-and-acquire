import { useEffect, useReducer } from 'react';
import { economy } from '../config/economy';
import { load, save, SAVE_KEY } from '../game/save';
import { newGame, reducer } from '../game/state';

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
