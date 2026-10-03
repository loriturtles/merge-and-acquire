/** Deterministic RNG (mulberry32). Returns the value and the next seed so state stays pure. */
export function rand(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** Picks an index using relative weights. */
export function pickWeighted(seed: number, weights: readonly number[]): [number, number] {
  const total = weights.reduce((a, b) => a + b, 0);
  const [r, next] = rand(seed);
  let roll = r * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return [i, next];
  }
  return [weights.length - 1, next];
}

export function pick<T>(seed: number, list: readonly T[]): [T, number] {
  const [r, next] = rand(seed);
  return [list[Math.floor(r * list.length)], next];
}
