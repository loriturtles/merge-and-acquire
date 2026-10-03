import { describe, expect, it } from 'vitest';
import { economy } from '../config/economy';
import { uniStage } from '../content/paths';
import { FALLBACK } from '../content/characters';
import { canMerge, drop, emptyBoard, nearestEmpty, place } from './board';
import { msToNextHour, refillHours, spendHours } from './hours';
import { canFill, fillOrders, matchItems } from './orders';
import { collectPaydays } from './payday';
import { deserialise, serialise } from './save';
import { newGame, orderContext, reducer, tick, wage } from './state';
import type { GameState, Piece } from './types';

const MIN = 60_000;
const HOUR = 60 * MIN;
const T0 = 1_700_000_000_000;

const item = (chain: 'study' | 'food', tier: number): Piece => ({ kind: 'item', chain, tier });
const gen = (chain: 'study' | 'food'): Piece => ({ kind: 'generator', chain });

function game(over: Partial<GameState> = {}): GameState {
  return { ...newGame({ now: T0, rows: 7, seed: 42 }), ...over };
}

describe('board', () => {
  it('merges two identical items into the next tier', () => {
    let b = emptyBoard(7, 7);
    b = place(b, 0, item('study', 2));
    b = place(b, 1, item('study', 2));
    const { board, result } = drop(b, 0, 1);
    expect(result).toBe('merge');
    expect(board.cells[1]).toEqual(item('study', 3));
    expect(board.cells[0]).toBeNull();
  });

  it('does not merge max-tier items, different tiers, different chains or generators', () => {
    expect(canMerge(item('study', 6), item('study', 6))).toBe(false);
    expect(canMerge(item('study', 2), item('study', 3))).toBe(false);
    expect(canMerge(item('study', 2), item('food', 2))).toBe(false);
    expect(canMerge(gen('study'), gen('study'))).toBe(false);
  });

  it('moves onto empty cells and swaps with anything else', () => {
    let b = emptyBoard(7, 7);
    b = place(b, 0, item('study', 6));
    b = place(b, 1, item('study', 6));
    expect(drop(b, 0, 5).result).toBe('move');
    const swapped = drop(b, 0, 1);
    expect(swapped.result).toBe('swap');
    b = place(b, 2, gen('food'));
    const g = drop(b, 2, 0);
    expect(g.result).toBe('swap');
    expect(g.board.cells[0]).toEqual(gen('food'));
  });

  it('dropping on itself does nothing', () => {
    const b = place(emptyBoard(7, 7), 3, item('food', 1));
    expect(drop(b, 3, 3).result).toBe('none');
  });

  it('finds the nearest empty cell, or -1 when full', () => {
    let b = emptyBoard(3, 3);
    b = place(b, 4, gen('study')); // centre
    expect([1, 3, 5, 7]).toContain(nearestEmpty(b, 4));
    b = { ...b, cells: b.cells.map(() => item('food', 1)) };
    expect(nearestEmpty(b, 4)).toBe(-1);
  });

  it('matches order items to cells, preferring the selected one and using each cell once', () => {
    let b = emptyBoard(7, 7);
    b = place(b, 2, item('food', 3));
    b = place(b, 9, item('food', 3));
    b = place(b, 11, item('study', 2));
    expect(matchItems(b, [{ chain: 'food', tier: 3 }], 9)).toEqual([9]);
    expect(matchItems(b, [{ chain: 'food', tier: 3 }], null)).toEqual([2]);
    expect(matchItems(b, [{ chain: 'food', tier: 3 }, { chain: 'study', tier: 2 }])).toEqual([2, 11]);
    expect(matchItems(b, [{ chain: 'food', tier: 4 }, { chain: 'study', tier: 2 }])).toEqual([-1, 11]);
  });
});

describe('hours', () => {
  const R = economy.hours.refillEveryMs;
  const cap = economy.hours.cap;

  it('refills one hour per interval and keeps the remainder', () => {
    const s = refillHours({ hours: 10, hoursAnchor: T0 }, T0 + 2.5 * R);
    expect(s).toEqual({ hours: 12, hoursAnchor: T0 + 2 * R });
    expect(msToNextHour(s, T0 + 2.5 * R)).toBe(0.5 * R);
  });

  it('never goes above the cap, even after a long time away', () => {
    expect(refillHours({ hours: 5, hoursAnchor: T0 }, T0 + 1000 * R).hours).toBe(cap);
  });

  it('starts the refill clock when you first drop below the cap', () => {
    const s = spendHours({ hours: cap, hoursAnchor: T0 - 10 * R }, 1, T0)!;
    expect(s).toEqual({ hours: cap - 1, hoursAnchor: T0 });
  });

  it('refuses to spend hours you do not have', () => {
    expect(spendHours({ hours: 0, hoursAnchor: T0 }, 1, T0 + 1)).toBeNull();
  });
});

describe('payday', () => {
  const E = economy.payday.everyMs;
  it('pays nothing before payday', () => {
    expect(collectPaydays(T0 + E, T0)).toEqual({ count: 0, nextPaydayAt: T0 + E });
  });
  it('pays once on time and schedules the next', () => {
    expect(collectPaydays(T0, T0 + 1)).toEqual({ count: 1, nextPaydayAt: T0 + E });
  });
  it('caps missed paydays but keeps the schedule', () => {
    const r = collectPaydays(T0, T0 + 10 * E + 5);
    expect(r.count).toBe(economy.payday.maxMissed);
    expect(r.nextPaydayAt).toBe(T0 + 11 * E);
  });
});

describe('orders', () => {
  const uni = { chainGroups: [uniStage.chains], cast: uniStage.cast, itemCountWeights: economy.orders.itemCountWeights, chains: uniStage.chains };

  it('fills up to the visible count with distinct characters and items', () => {
    const { orders } = fillOrders(uni, [], 1, 7, T0);
    expect(orders).toHaveLength(economy.orders.visible);
    expect(new Set(orders.map((o) => o.characterId)).size).toBe(orders.length);
    for (const o of orders) {
      expect(o.items.length).toBeGreaterThanOrEqual(1);
      expect(o.items.length).toBeLessThanOrEqual(economy.orders.itemCountWeights.length);
      expect(new Set(o.items.map((i) => `${i.chain}-${i.tier}`)).size).toBe(o.items.length);
      for (const i of o.items) expect(uni.chains).toContain(i.chain);
      expect(o.reward).toBe(o.items.reduce((sum, i) => sum + economy.orderBonus(i.tier), 0));
      expect(o.text.length).toBeGreaterThan(0);
    }
  });

  it('sometimes asks for several items', () => {
    const counts = new Set<number>();
    for (let seed = 0; seed < 200; seed++) for (const o of fillOrders(uni, [], 1, seed, T0).orders) counts.add(o.items.length);
    expect([...counts].sort()).toEqual([1, 2, 3]);
  });

  it('always gives requests a line written for that item', () => {
    for (let seed = 0; seed < 300; seed++) {
      for (const o of fillOrders(uni, [], 1, seed, T0).orders) {
        expect(FALLBACK.map((l) => l.text)).not.toContain(o.text);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    expect(fillOrders(uni, [], 1, 99, T0)).toEqual(fillOrders(uni, [], 1, 99, T0));
  });

  it('knows when an order can be filled', () => {
    const s = game();
    const order = { ...s.orders[0], items: [{ chain: 'food' as const, tier: 1 }] };
    expect(canFill(s.board, order)).toBe(true);
    // Needs two noodles: the starting board has two.
    expect(canFill(s.board, { ...order, items: [{ chain: 'food', tier: 1 }, { chain: 'study', tier: 1 }] })).toBe(true);
    expect(canFill(s.board, { ...order, items: [{ chain: 'food', tier: 1 }, { chain: 'food', tier: 5 }] })).toBe(false);
  });
});

describe('reducer', () => {
  it('starts with both Uni generators and full hours', () => {
    const s = game();
    const gens = s.board.cells.filter((c) => c?.kind === 'generator');
    expect(gens).toEqual([gen('study'), gen('food')]);
    expect(s.hours).toBe(economy.hours.cap);
  });

  it('tapping a generator spends an hour and spawns a tier-1 item nearby', () => {
    const s = game();
    const g = s.board.cells.findIndex((c) => c?.kind === 'generator' && c.chain === 'food');
    const next = reducer(s, { type: 'tap', index: g, now: T0 + 1 });
    expect(next.hours).toBe(s.hours - 1);
    expect(next.event?.type).toBe('spawn');
    const at = (next.event as { index: number }).index;
    expect(next.board.cells[at]).toEqual(item('food', 1));
  });

  it('refuses to spawn with no hours or a full board', () => {
    const s = game({ hours: -economy.hours.overtimeMax, hoursAnchor: T0 });
    const g = s.board.cells.findIndex((c) => c?.kind === 'generator');
    const noHours = reducer(s, { type: 'tap', index: g, now: T0 + 1 });
    expect(noHours.event).toMatchObject({ type: 'denied', reason: 'no-hours' });

    const full = game();
    full.board = { ...full.board, cells: full.board.cells.map((c) => c ?? item('study', 6)) };
    const r = reducer(full, { type: 'tap', index: g, now: T0 + 1 });
    expect(r.event).toMatchObject({ type: 'denied', reason: 'board-full' });
    expect(r.hours).toBe(full.hours);
  });

  it('delivering removes every item, pays the bonus, chats, and posts a new request', () => {
    let s = game();
    const order = { ...s.orders[0], items: [{ chain: 'study' as const, tier: 5 }, { chain: 'food' as const, tier: 4 }], reward: 240 };
    s = { ...s, orders: [order, ...s.orders.slice(1)] };
    s = { ...s, board: place(place(s.board, 48, item('study', 5)), 47, item('food', 4)) };
    const next = reducer(s, { type: 'deliver', orderId: order.id, now: T0 + 5 });
    expect(next.salary).toBe(s.salary + 240);
    expect(next.board.cells[48]).toBeNull();
    expect(next.board.cells[47]).toBeNull();
    const added = next.chat.slice(s.chat.length);
    expect(added.map((m) => m.from)).toEqual(['you', order.characterId, next.orders[2].characterId]);
    expect(added[2].orderId).toBe(next.orders[2].id);
    expect(next.orders).toHaveLength(economy.orders.visible);
    expect(next.orders.some((o) => o.id === order.id)).toBe(false);
    expect(next.orders.some((o) => o.characterId === order.characterId)).toBe(false);
  });

  it('delivering without the item does nothing', () => {
    const s = game();
    const order = { ...s.orders[0], items: [{ chain: 'study' as const, tier: 6 }] };
    const st = { ...s, orders: [order, ...s.orders.slice(1)] };
    expect(reducer(st, { type: 'deliver', orderId: order.id, now: T0 })).toBe(st);
  });

  it('selling pays 2^tier and never sells generators', () => {
    let s = game();
    s = { ...s, board: place(s.board, 48, item('study', 4)) };
    const sold = reducer(s, { type: 'sell', index: 48, now: T0 });
    expect(sold.salary).toBe(s.salary + 16);
    const g = s.board.cells.findIndex((c) => c?.kind === 'generator');
    expect(reducer(s, { type: 'sell', index: g, now: T0 })).toBe(s);
  });

  it('starts the chat with one message per request, all unread', () => {
    const s = game();
    expect(s.chat.map((m) => m.orderId)).toEqual(s.orders.map((o) => o.id));
    expect(s.chat.every((m) => m.at > s.chatReadAt)).toBe(true);
    expect(reducer(s, { type: 'readChat', now: T0 + 1 }).chatReadAt).toBe(T0 + 1);
  });

  it('pays a real fortnightly paycheck: Fresher is $9,300 a year', () => {
    expect(wage(game())).toBe(Math.round(9_300 / 26));
  });

  it('tick pays the wage on payday', () => {
    const s = game();
    const later = tick(s, s.nextPaydayAt + 1);
    expect(later.salary).toBe(s.salary + wage(s));
    expect(later.event).toMatchObject({ type: 'payday', count: 1 });
  });
});

describe('save', () => {
  it('round-trips and catches up time spent away', () => {
    const s = { ...game(), hours: 10, hoursAnchor: T0 };
    const away = T0 + 5 * HOUR;
    const loaded = deserialise(serialise(s), away)!;
    expect(loaded.board).toEqual(s.board);
    expect(loaded.hours).toBe(economy.hours.cap);
    expect(loaded.salary).toBe(s.salary + wage(s)); // one payday at 4h
  });

  it('upgrades a v1 save with single-item orders', () => {
    const { chat: _c, nextMessageId: _n, chatReadAt: _r, ...rest } = game();
    const v1 = { ...rest, version: 1, orders: rest.orders.map(({ items, ...o }) => ({ ...o, chain: items[0].chain, tier: items[0].tier })) };
    const loaded = deserialise(JSON.stringify(v1), T0)!;
    expect(loaded.version).toBe(3);
    expect(loaded.orders[0].items).toEqual([rest.orders[0].items[0]]);
    expect(loaded.chat).toHaveLength(loaded.orders.length);
  });

  it('rejects broken or unknown saves', () => {
    expect(deserialise(null, T0)).toBeNull();
    expect(deserialise('{oops', T0)).toBeNull();
    expect(deserialise(JSON.stringify({ version: 99 }), T0)).toBeNull();
  });

  it('upgrades a v2 save into the career model', () => {
    const { stage: _s, path: _p, xp: _x, level: _l, vesting: _v, notices: _n, reviewed: _r, ...rest } = game({ titleIndex: 2 });
    const v2 = { ...rest, version: 2, chapterId: 'uni' };
    const loaded = deserialise(JSON.stringify(v2), T0)!;
    expect(loaded).toMatchObject({ version: 3, stage: 'uni', path: null, level: 3, vesting: [], notices: [] });
  });
});

// ---- Career progression -----------------------------------------------------

/** A fresh game moved straight to the first job on a path. */
function onPath(path: 'engineer' | 'product' | 'sales' | 'founder', over: Partial<GameState> = {}): GameState {
  const s = { ...game(), notices: [{ type: 'choose-path' as const }] };
  return { ...reducer(s, { type: 'choosePath', path, now: T0 }), notices: [], ...over };
}

/** Puts the items an order needs on the board and delivers it. */
function fill(s: GameState, orderIndex = 0, now = T0 + 1): GameState {
  const order = s.orders[orderIndex];
  let board = s.board;
  for (const it of order.items) board = place(board, board.cells.findIndex((c) => !c), { kind: 'item', ...it });
  return reducer({ ...s, board }, { type: 'deliver', orderId: order.id, now });
}

describe('progression', () => {
  it('delivering earns XP; a full bar promotes with a pay rise and a share grant', () => {
    let s = game({ xp: economy.xp.toNext(1) - 1 });
    s = fill(s);
    expect(s.titleIndex).toBe(1);
    expect(s.level).toBe(2);
    expect(s.notices[0]).toMatchObject({ type: 'promotion', from: 'Fresher', to: 'Second-year' });
    expect(s.vesting.some((g) => g.reason === 'Promoted to Second-year')).toBe(true);
  });

  it('the last Uni title leads to a review, then the path choice, then chapter 2', () => {
    let s = game({ titleIndex: 4, level: 5, xp: economy.xp.toNext(5) - 1 });
    s = fill(s);
    expect(s.notices[0]).toMatchObject({ type: 'review', stage: 'uni' });
    s = reducer(s, { type: 'dismissNotice', now: T0 + 2 });
    expect(s.notices[0]).toEqual({ type: 'choose-path' });
    // The path choice can't be dismissed, only chosen.
    expect(reducer(s, { type: 'dismissNotice', now: T0 + 2 })).toBe(s);
    s = reducer(s, { type: 'choosePath', path: 'sales', now: T0 + 3 });
    expect(s.stage).toBe('first-job');
    expect(s.path).toBe('sales');
    expect(s.board.cells.some((c) => c?.kind === 'generator' && c.chain === 'swag')).toBe(true);
    expect(s.orders.every((o) => ['ruth', 'lee', 'marco', 'nina', 'byte'].includes(o.characterId))).toBe(true);
    expect(s.chat.some((m) => m.from === 'system')).toBe(true);
    expect(s.notices[0]).toMatchObject({ type: 'new-chapter', stage: 'first-job' });
  });

  it('a review is rated on requests filled against the target', () => {
    let s = game({ titleIndex: 4, level: 5, xp: economy.xp.toNext(5) - 1 });
    s = { ...s, stats: { ...s.stats, ordersThisChapter: 99 } };
    expect(fill(s).notices[0]).toMatchObject({ type: 'review', rating: 'Redefines expectations' });
  });

  it('pays the real salary for the path title', () => {
    expect(wage(onPath('engineer'))).toBe(Math.round(73_400 / 26));
    expect(wage(onPath('founder'))).toBe(0);
  });
});

describe('path twists', () => {
  it('engineer: the pager drops a bug on the desk', () => {
    const s = onPath('engineer');
    const later = tick(s, s.nextPageAt + 1);
    expect(later.event).toMatchObject({ type: 'paged' });
    const at = (later.event as { index: number }).index;
    expect(later.board.cells[at]).toEqual({ kind: 'item', chain: 'code', tier: 1 });
  });

  it('sales: deliveries pay 3×', () => {
    const s = onPath('sales');
    const order = s.orders[0];
    expect(fill(s).salary - s.salary).toBe(order.reward * 3);
  });

  it('founder: every delivery grants a share', () => {
    const s = onPath('founder');
    expect(fill(s).vesting.some((g) => g.reason.startsWith('Delivery'))).toBe(true);
  });

  it('product: requests ask for more items at once', () => {
    const multiShare = (state: GameState) => {
      const ctx = orderContext(state);
      let multi = 0;
      let all = 0;
      for (let seed = 0; seed < 200; seed++) {
        for (const o of fillOrders(ctx, [], 1, seed, T0).orders) {
          all++;
          if (o.items.length > 1) multi++;
        }
      }
      return multi / all;
    };
    expect(multiShare(onPath('product'))).toBeGreaterThan(multiShare(onPath('engineer')) + 0.2);
  });
});

describe('overtime and burnout', () => {
  it('at 0 hours you can work into overtime, and too much burns you out', () => {
    let s = game({ hours: 0, hoursAnchor: T0 });
    const g = s.board.cells.findIndex((c) => c?.kind === 'generator');
    s = reducer(s, { type: 'tap', index: g, now: T0 + 1 });
    expect(s.hours).toBe(-1);
    expect(s.event).toMatchObject({ type: 'overtime' });

    s = { ...s, overtimeLog: Array(economy.hours.burnoutThreshold).fill(T0) };
    s = { ...s, board: { ...s.board, cells: s.board.cells.map((c, i) => (c?.kind === 'item' && i !== g ? null : c)) } };
    s = reducer(s, { type: 'tap', index: g, now: T0 + 2 });
    expect(s.event).toMatchObject({ type: 'burnout' });
    expect(s.burntOutUntil).toBe(T0 + 2 + economy.hours.burnoutMs);
  });

  it('overtime stops at the floor', () => {
    const s = game({ hours: -economy.hours.overtimeMax, hoursAnchor: T0 });
    const g = s.board.cells.findIndex((c) => c?.kind === 'generator');
    expect(reducer(s, { type: 'tap', index: g, now: T0 + 1 }).event).toMatchObject({ type: 'denied', reason: 'no-hours' });
  });

  it('burnout halves delivery pay', () => {
    const s = game({ burntOutUntil: T0 + 60_000 });
    expect(fill(s).salary - s.salary).toBe(Math.round(s.orders[0].reward / 2));
  });
});

describe('shares', () => {
  it('grants vest after 24 hours', () => {
    const s = game({ vesting: [{ amount: 5, vestAt: T0 + 10, reason: 'test' }] });
    expect(tick(s, T0 + 5).shares).toBe(0);
    const later = tick(s, T0 + 11);
    expect(later.shares).toBe(5);
    expect(later.vesting).toEqual([]);
  });

  it('a long weekend refills hours and clears burnout', () => {
    const s = reducer(game({ shares: 5, hours: -4, burntOutUntil: T0 + 999 }), { type: 'refillHours', now: T0 });
    expect(s.hours).toBe(economy.hours.cap);
    expect(s.burntOutUntil).toBe(0);
    expect(s.shares).toBe(5 - economy.shares.refillCost);
  });

  it('fast-tracks an item up a tier, never past the top', () => {
    let s = game({ shares: 4 });
    s = { ...s, board: place(s.board, 48, item('food', 2)) };
    expect(reducer(s, { type: 'upgradeItem', index: 48, now: T0 }).board.cells[48]).toEqual(item('food', 3));
    s = { ...s, board: place(s.board, 48, item('food', 6)) };
    expect(reducer(s, { type: 'upgradeItem', index: 48, now: T0 })).toBe(s);
  });
});

describe('events and office', () => {
  it('the engagement survey opens, and answering it lifts pay', () => {
    let s = tick(game(), T0 + economy.survey.firstAfterMs + 1);
    expect(s.surveyEndsAt).toBeGreaterThan(s.updatedAt);
    s = reducer(s, { type: 'answerSurvey', now: s.updatedAt });
    expect(s.moodUntil).toBeGreaterThan(s.updatedAt);
    const order = s.orders[0];
    expect(fill(s, 0, s.updatedAt + 1).salary - s.salary).toBe(Math.round(order.reward * economy.survey.moodPayMultiplier));
  });

  it('buying rebuild tasks costs salary, gives XP, and finishing the space grants shares', () => {
    let s = game({ salary: 10_000 });
    const tasks = ['fairy-lights', 'desk-lamp', 'bookshelf', 'beanbag', 'couch', 'mini-fridge'];
    s = reducer(s, { type: 'buyTask', taskId: 'couch', now: T0 });
    expect(s.salary).toBe(10_000 - 150);
    expect(s.xp).toBeGreaterThan(0);
    for (const t of tasks) s = reducer({ ...s, notices: [] }, { type: 'buyTask', taskId: t, now: T0 });
    expect(s.office['share-house']).toHaveLength(6);
    expect(s.notices.some((n) => n.type === 'space-done')).toBe(true);
  });

  it('cannot buy without the salary', () => {
    const s = reducer(game({ salary: 10 }), { type: 'buyTask', taskId: 'couch', now: T0 });
    expect(s.event).toMatchObject({ type: 'denied', reason: 'no-salary' });
  });
});
