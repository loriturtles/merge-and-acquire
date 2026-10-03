import { economy } from '../config/economy';

export interface HoursState {
  hours: number;
  hoursAnchor: number;
}

const { cap, refillEveryMs } = economy.hours;

/** Adds the hours earned since the anchor. Works the same for a 1s tick or a week offline. */
export function refillHours(s: HoursState, now: number): HoursState {
  if (s.hours >= cap) return { hours: s.hours, hoursAnchor: now };
  const gained = Math.floor(Math.max(0, now - s.hoursAnchor) / refillEveryMs);
  if (gained === 0) return s;
  const hours = Math.min(cap, s.hours + gained);
  return { hours, hoursAnchor: hours >= cap ? now : s.hoursAnchor + gained * refillEveryMs };
}

/** Spends hours, going no lower than `floor` (negative = overtime). Returns null if there aren't enough. */
export function spendHours(s: HoursState, amount: number, now: number, floor = 0): HoursState | null {
  const current = refillHours(s, now);
  if (current.hours - amount < floor) return null;
  // The refill clock only starts once you drop below the cap.
  const anchor = current.hours >= cap ? now : current.hoursAnchor;
  return { hours: current.hours - amount, hoursAnchor: anchor };
}

/** Milliseconds until the next hour comes back, or null when full. */
export function msToNextHour(s: HoursState, now: number): number | null {
  if (s.hours >= cap) return null;
  return Math.max(0, s.hoursAnchor + refillEveryMs - now);
}
