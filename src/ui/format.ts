const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const formatMoney = (n: number) => money.format(n);

/** "1h 12m", "4m 05s", "12s" */
export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

/** "1:05" (minutes:seconds) */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Chat timestamps: "now", "3m", "2h", "1d" */
export function formatAgo(ms: number): string {
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

/** Item name in a sentence: "an essay", "a toastie", "flashcards", "an A+ exam" */
export function withArticle(name: string): string {
  const lower = /^[A-Z][a-z]/.test(name) ? name[0].toLowerCase() + name.slice(1) : name;
  if (/[^s]s$/.test(lower)) return lower;
  return /^[aeiou]/i.test(lower) ? `an ${lower}` : `a ${lower}`;
}
