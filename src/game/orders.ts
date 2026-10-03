import { economy } from '../config/economy';
import { maxTierOf, type ChainId } from '../content/chains';
import { FALLBACK, getCharacter, linesFor, multiLinesFor, type Character } from '../content/characters';
import { pick, pickWeighted, rand } from './rng';
import type { Board, Order, OrderItem } from './types';

/** What requests can contain and who can send them, from the current career (see career.ts). */
export interface OrderContext {
  /** Unlocked chains grouped by chapter, oldest first. */
  chainGroups: ChainId[][];
  /** Character ids who can post requests. */
  cast: string[];
  itemCountWeights: readonly number[];
}

const key = (i: OrderItem) => `${i.chain}-${i.tier}`;

/** Picks 1–3 distinct items, avoiding ones other open requests already want where possible. */
function pickItems(ctx: OrderContext, existing: Order[], seed: number): [OrderItem[], number] {
  const taken = new Set(existing.flatMap((o) => o.items.map(key)));
  const [countIndex, s0] = pickWeighted(seed, ctx.itemCountWeights);
  let s = s0;
  const items: OrderItem[] = [];
  const newest = ctx.chainGroups[ctx.chainGroups.length - 1];
  const older = ctx.chainGroups.slice(0, -1).flat();
  for (let attempt = 0; attempt < 20 && items.length <= countIndex; attempt++) {
    // Mostly the newest chapter's chains, sometimes older ones.
    const [r, s1] = rand(s);
    const group = older.length && r >= economy.orders.newestChainShare ? older : newest;
    const [chain, s2] = pick(s1, group);
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
  ctx: OrderContext,
  existing: Order[],
  id: number,
  seed: number,
  now: number,
  /** Characters to skip if possible, e.g. whoever was just served. */
  avoid: string[] = [],
): [Order, number] {
  const cast = ctx.cast.map(getCharacter).filter((c): c is Character => !!c);
  const busy = new Set([...existing.map((o) => o.characterId), ...avoid]);

  const [items, s1] = pickItems(ctx, existing, seed);
  const single = items.length === 1;
  const lines = (c: Character) => (single ? linesFor(items[0].chain, items[0].tier, c) : multiLinesFor(c));

  // Prefer someone who isn't busy and has something to say about this request.
  const free = cast.filter((c) => !busy.has(c.id));
  const pool = [free.filter((c) => lines(c) !== FALLBACK), free, cast].find((p) => p.length)!;
  const [who, s2] = pick(s1, pool);
  const [line, s3] = pick(s2, lines(who));

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
  ctx: OrderContext,
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
    const [order, next] = makeOrder(ctx, out, id++, s, now, avoid);
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
