import { economy } from '../config/economy';
import { maxTierOf, type ChainId } from '../content/chains';
import type { ChapterDef } from '../content/chapters';
import { characters, FALLBACK, linesFor, type Role } from '../content/characters';
import { findItem } from './board';
import { pick, pickWeighted } from './rng';
import type { Board, Order } from './types';

/** Creates one request from a character who isn't already waiting on something. */
export function makeOrder(
  chapter: ChapterDef,
  existing: Order[],
  id: number,
  seed: number,
  now: number,
  /** Characters to skip if possible, e.g. whoever was just served. */
  avoid: string[] = [],
): [Order, number] {
  const cast = characters.filter((c) => c.chapter === chapter.id);
  const busy = new Set([...existing.map((o) => o.characterId), ...avoid]);
  let s = seed;

  // Avoid asking for the exact same item twice at once.
  let chain: ChainId = chapter.chains[0];
  let tier = 1;
  for (let attempt = 0; attempt < 8; attempt++) {
    const [c, s2] = pick(s, chapter.chains);
    const weights = economy.orders.tierWeights.slice(0, maxTierOf(c));
    const [t, s3] = pickWeighted(s2, weights);
    s = s3;
    chain = c;
    tier = t + 1;
    if (!existing.some((o) => o.chain === chain && o.tier === tier)) break;
  }

  // Prefer someone who isn't already waiting and has something to say about this item.
  const hasLine = (role: Role) => linesFor(chain, tier, role) !== FALLBACK;
  const free = cast.filter((c) => !busy.has(c.id));
  const pool = [free.filter((c) => hasLine(c.role)), free, cast].find((p) => p.length)!;
  const [who, s1] = pick(s, pool);
  const [line, s4] = pick(s1, linesFor(chain, tier, who.role));
  s = s4;

  return [
    {
      id,
      characterId: who.id,
      chain,
      tier,
      text: line.text,
      reward: economy.orderBonus(tier),
      postedAt: now,
    },
    s,
  ];
}

/** Tops up the order list to the visible count. */
export function fillOrders(
  chapter: ChapterDef,
  orders: Order[],
  nextId: number,
  seed: number,
  now: number,
  avoid: string[] = [],
): { orders: Order[]; nextOrderId: number; rngSeed: number } {
  const out = orders.slice();
  let id = nextId;
  let s = seed;
  while (out.length < economy.orders.visible) {
    const [order, next] = makeOrder(chapter, out, id++, s, now, avoid);
    out.push(order);
    s = next;
  }
  return { orders: out, nextOrderId: id, rngSeed: s };
}

export function canFill(board: Board, order: Order): boolean {
  return findItem(board, order.chain, order.tier) !== -1;
}
