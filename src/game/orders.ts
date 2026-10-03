import { economy } from '../config/economy';
import { maxTierOf } from '../content/chains';
import type { ChapterDef } from '../content/chapters';
import { characters, FALLBACK, linesFor, linesForRole, multiLines, type Role } from '../content/characters';
import { pick, pickWeighted } from './rng';
import type { Board, Order, OrderItem } from './types';

const key = (i: OrderItem) => `${i.chain}-${i.tier}`;

/** Picks 1–3 distinct items, avoiding ones other open requests already want where possible. */
function pickItems(chapter: ChapterDef, existing: Order[], seed: number): [OrderItem[], number] {
  const taken = new Set(existing.flatMap((o) => o.items.map(key)));
  let [countIndex, s] = pickWeighted(seed, economy.orders.itemCountWeights);
  const items: OrderItem[] = [];
  for (let attempt = 0; attempt < 20 && items.length <= countIndex; attempt++) {
    const [chain, s2] = pick(s, chapter.chains);
    const [t, s3] = pickWeighted(s2, economy.orders.tierWeights.slice(0, maxTierOf(chain)));
    s = s3;
    const item = { chain, tier: t + 1 };
    if (items.some((i) => key(i) === key(item))) continue;
    if (taken.has(key(item)) && attempt < 12) continue;
    items.push(item);
  }
  // Highest tier first: it's the headline of the request.
  items.sort((a, b) => b.tier - a.tier);
  return [items, s];
}

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

  const [items, s1] = pickItems(chapter, existing, seed);
  const single = items.length === 1;
  const linesFor_ = (role: Role) => (single ? linesFor(items[0].chain, items[0].tier, role) : linesForRole(multiLines, role));

  // Prefer someone who isn't busy and has something to say about this request.
  const free = cast.filter((c) => !busy.has(c.id));
  const pool = [free.filter((c) => linesFor_(c.role) !== FALLBACK), free, cast].find((p) => p.length)!;
  const [who, s2] = pick(s1, pool);
  const [line, s3] = pick(s2, linesFor_(who.role));

  return [
    {
      id,
      characterId: who.id,
      items,
      text: line.text,
      reward: items.reduce((sum, i) => sum + economy.orderBonus(i.tier), 0),
      postedAt: now,
    },
    s3,
  ];
}

/** Tops up the order list to the visible count. Returns the new orders separately for the chat. */
export function fillOrders(
  chapter: ChapterDef,
  orders: Order[],
  nextId: number,
  seed: number,
  now: number,
  avoid: string[] = [],
): { orders: Order[]; added: Order[]; nextOrderId: number; rngSeed: number } {
  const out = orders.slice();
  const added: Order[] = [];
  let id = nextId;
  let s = seed;
  while (out.length < economy.orders.visible) {
    const [order, next] = makeOrder(chapter, out, id++, s, now, avoid);
    out.push(order);
    added.push(order);
    s = next;
  }
  return { orders: out, added, nextOrderId: id, rngSeed: s };
}

/**
 * Board cells that would fill each item of the order, in order (-1 where missing).
 * Each cell is used once; the selected cell is preferred when it matches.
 */
export function matchItems(board: Board, items: OrderItem[], prefer?: number | null): number[] {
  const used = new Set<number>();
  return items.map((item) => {
    const fits = (i: number) => {
      const c = board.cells[i];
      return !used.has(i) && c?.kind === 'item' && c.chain === item.chain && c.tier === item.tier;
    };
    let index = prefer != null && fits(prefer) ? prefer : board.cells.findIndex((_, i) => fits(i));
    if (index !== -1) used.add(index);
    return index;
  });
}

export function canFill(board: Board, order: Order): boolean {
  return matchItems(board, order.items).every((i) => i !== -1);
}
