import { economy } from '../config/economy';

const { everyMs, maxMissed } = economy.payday;

/**
 * Works out how many paydays have passed. Paydays missed while away pile up,
 * but only up to `maxMissed`; the timer always moves on to the next future slot.
 */
export function collectPaydays(
  nextPaydayAt: number,
  now: number,
): { count: number; nextPaydayAt: number } {
  if (now < nextPaydayAt) return { count: 0, nextPaydayAt };
  const passed = Math.floor((now - nextPaydayAt) / everyMs) + 1;
  return {
    count: Math.min(passed, maxMissed),
    nextPaydayAt: nextPaydayAt + passed * everyMs,
  };
}
