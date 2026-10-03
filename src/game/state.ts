import { economy } from '../config/economy';
import { maxTierOf, type ChainId } from '../content/chains';
import { deliverLines, getCharacter, thanksLinesFor } from '../content/characters';
import { reviewRatings } from '../content/events';
import { getSpace } from '../content/office';
import { getPath, getStage, nextStage, type PathId, type StageId } from '../content/paths';
import { drop, emptyBoard, nearestEmpty, place } from './board';
import {
  cast,
  chainsByStage,
  currentTitle,
  generatorDrops,
  isBurntOut,
  paycheck,
  payout,
  rules,
  titlesFor,
  wage,
} from './career';
import { refillHours, spendHours } from './hours';
import { fillOrders, matchItems, type OrderContext } from './orders';
import { collectPaydays } from './payday';
import { pick, pickWeighted, rand } from './rng';
import type { ChatMessage, GameEvent, GameState, Notice, Order, Piece } from './types';

export { wage };

export type Action =
  | { type: 'tick'; now: number }
  | { type: 'tap'; index: number; now: number }
  | { type: 'drop'; from: number; to: number; now: number }
  | { type: 'deliver'; orderId: number; now: number }
  | { type: 'sell'; index: number; now: number }
  | { type: 'deselect' }
  | { type: 'readChat'; now: number }
  | { type: 'dismissNotice'; now: number }
  | { type: 'choosePath'; path: PathId; now: number }
  | { type: 'buyTask'; taskId: string; now: number }
  | { type: 'refillHours'; now: number }
  | { type: 'upgradeItem'; index: number; now: number }
  | { type: 'answerSurvey'; now: number }
  | { type: 'reset'; state: GameState };

// ---- Setup -----------------------------------------------------------------

export function newGame(opts: { now: number; rows: number; seed: number }): GameState {
  const { cols } = economy.board;
  let board = emptyBoard(cols, opts.rows);
  const at = (x: number, y: number) => y * cols + x;
  const starting: [number, number, Piece][] = [
    [1, 2, { kind: 'generator', chain: 'study' }],
    [5, 2, { kind: 'generator', chain: 'food' }],
    [1, 3, { kind: 'item', chain: 'study', tier: 1 }],
    [2, 2, { kind: 'item', chain: 'study', tier: 1 }],
    [2, 3, { kind: 'item', chain: 'study', tier: 1 }],
    [5, 3, { kind: 'item', chain: 'food', tier: 1 }],
    [4, 2, { kind: 'item', chain: 'food', tier: 1 }],
  ];
  for (const [x, y, piece] of starting) board = place(board, at(x, y), piece);

  const base: GameState = {
    version: 3,
    stage: 'uni',
    path: null,
    titleIndex: 0,
    xp: 0,
    level: 1,
    pendingGenerators: [],
    board,
    selected: null,
    hours: economy.hours.cap,
    hoursAnchor: opts.now,
    overtimeLog: [],
    burntOutUntil: 0,
    salary: economy.start.salary,
    shares: economy.start.shares,
    vesting: [],
    nextPaydayAt: opts.now + economy.payday.everyMs,
    nextPageAt: 0,
    surveyEndsAt: 0,
    nextSurveyAt: opts.now + economy.survey.firstAfterMs,
    moodUntil: 0,
    office: {},
    stats: { ordersThisChapter: 0, ordersTotal: 0, deliveredTo: {} },
    reviewed: [],
    notices: [],
    orders: [],
    nextOrderId: 1,
    chat: [],
    nextMessageId: 1,
    chatReadAt: 0,
    rngSeed: opts.seed,
    updatedAt: opts.now,
    event: null,
  };
  return postNewOrders(base, [], opts.now);
}

// ---- Helpers ---------------------------------------------------------------

export function orderContext(s: GameState): OrderContext {
  return {
    chainGroups: chainsByStage(s),
    cast: cast(s),
    itemCountWeights: rules(s).itemCountWeights ?? economy.orders.itemCountWeights,
  };
}

type NewMessage = Omit<ChatMessage, 'id'>;

const requestMessage = (o: Order): NewMessage => ({ from: o.characterId, text: o.text, at: o.postedAt, orderId: o.id, items: o.items });

/** Appends messages to #team-requests, keeping the history short. */
function post(state: GameState, messages: NewMessage[]): GameState {
  let id = state.nextMessageId;
  const chat = [...state.chat, ...messages.map((m) => ({ ...m, id: id++ }))].slice(-economy.orders.chatHistory);
  return { ...state, chat, nextMessageId: id };
}

/** Tops up requests and posts the new ones in the chat. */
function postNewOrders(state: GameState, avoid: string[], now: number): GameState {
  const { added, ...filled } = fillOrders(orderContext(state), state.orders, state.nextOrderId, state.rngSeed, now, avoid);
  return post({ ...state, ...filled }, added.map(requestMessage));
}

const withEvent = (s: GameState, event: GameEvent): GameState => ({ ...s, event });
const notify = (s: GameState, notice: Notice): GameState => ({ ...s, notices: [...s.notices, notice] });

/** Adds unvested shares. */
function grant(s: GameState, amount: number, reason: string, now: number): GameState {
  if (amount <= 0) return s;
  return { ...s, vesting: [...s.vesting, { amount, vestAt: now + economy.shares.vestMs, reason }] };
}

/** Places queued generators wherever there's room. */
function placeGenerators(s: GameState): GameState {
  let board = s.board;
  const left: ChainId[] = [];
  const middle = Math.floor(board.rows / 2) * board.cols + Math.floor(board.cols / 2);
  for (const chain of s.pendingGenerators) {
    const at = nearestEmpty(board, middle);
    if (at === -1) left.push(chain);
    else board = place(board, at, { kind: 'generator', chain });
  }
  return { ...s, board, pendingGenerators: left };
}

// ---- Progression -------------------------------------------------------------

/** Adds XP, promoting through titles and triggering the chapter's performance review. */
function gainXp(state: GameState, xp: number, now: number): GameState {
  let s = { ...state, xp: state.xp + xp };
  for (;;) {
    const need = economy.xp.toNext(s.level);
    if (s.xp < need) return s;
    const titles = titlesFor(s.stage, s.path);
    const multiplier = rules(s).shareGrantMultiplier ?? 1;

    if (s.titleIndex < titles.length - 1) {
      const from = currentTitle(s);
      const to = titles[s.titleIndex + 1];
      const shares = economy.shares.promotionGrant(s.level) * multiplier;
      s = { ...s, xp: s.xp - need, level: s.level + 1, titleIndex: s.titleIndex + 1 };
      s = grant(s, shares, `Promoted to ${to}`, now);
      s = notify(s, { type: 'promotion', from, to, oldPay: paycheck(from), newPay: paycheck(to), shares });
      continue;
    }

    // Top of this chapter's ladder: one performance review, then on to the next chapter.
    if (s.reviewed.includes(s.stage)) return { ...s, xp: Math.min(s.xp, need - 1) };
    const target = economy.review.targetOrders[s.stage] ?? 12;
    const ratio = s.stats.ordersThisChapter / target;
    const ratingIndex = reviewRatings.reduce((best, r, i) => (ratio >= r.min ? i : best), 0);
    const rating = reviewRatings[ratingIndex];
    const shares = economy.review.shares[ratingIndex] * multiplier;
    s = { ...s, xp: s.xp - need, level: s.level + 1, reviewed: [...s.reviewed, s.stage] };
    s = grant(s, shares, `${getStage(s.stage).name} performance review`, now);
    return notify(s, {
      type: 'review',
      stage: s.stage,
      rating: rating.label,
      line: rating.line,
      ordersFilled: s.stats.ordersThisChapter,
      target,
      shares,
    });
  }
}

/** Moves to a new chapter: new titles, chains, generators, cast and space. */
function enterStage(state: GameState, stage: StageId, path: PathId, now: number): GameState {
  const pathDef = getPath(path);
  const newChains = stage === 'uni' ? [] : pathDef.stages[stage].chains;
  const onBoard = new Set(state.board.cells.flatMap((c) => (c?.kind === 'generator' ? [c.chain] : [])));
  const info = getStage(stage);

  let s: GameState = {
    ...state,
    stage,
    path,
    titleIndex: 0,
    xp: 0,
    pendingGenerators: [...state.pendingGenerators, ...newChains.filter((c) => !onBoard.has(c))],
    stats: { ...state.stats, ordersThisChapter: 0 },
    nextPageAt: pathDef.rules.onCall ? now + pathDef.rules.onCall.everyMs : 0,
    orders: [],
  };
  s = placeGenerators(s);
  s = post(s, [{ from: 'system', text: `Chapter ${info.chapter} · ${info.space}`, at: now }]);
  s = postNewOrders(s, [], now);
  return notify(s, { type: 'new-chapter', stage });
}

// ---- Timers ------------------------------------------------------------------

/** Brings timers up to `now`: hours, paydays, vesting, pager, survey. Used every second and after time away. */
export function tick(state: GameState, now: number): GameState {
  let s = state;
  let event = s.event;

  const hours = refillHours(s, now);
  if (hours.hours !== s.hours || hours.hoursAnchor !== s.hoursAnchor) s = { ...s, ...hours };

  const pay = collectPaydays(s.nextPaydayAt, now);
  if (pay.count) {
    const amount = pay.count * wage(s);
    s = { ...s, salary: s.salary + amount, nextPaydayAt: pay.nextPaydayAt };
    event = { type: 'payday', amount, count: pay.count, at: now };
  }

  const vested = s.vesting.filter((g) => g.vestAt <= now);
  if (vested.length) {
    const amount = vested.reduce((sum, g) => sum + g.amount, 0);
    s = { ...s, shares: s.shares + amount, vesting: s.vesting.filter((g) => g.vestAt > now) };
    event = { type: 'vested', amount, at: now };
  }

  // Engineer twist: the pager drops a bug on your desk.
  const onCall = rules(s).onCall;
  if (onCall && s.stage !== 'uni' && s.nextPageAt && now >= s.nextPageAt) {
    s = { ...s, nextPageAt: now + onCall.everyMs };
    const bugs = s.board.cells.filter((c) => c?.kind === 'item' && c.chain === 'code' && c.tier === 1).length;
    const empty = s.board.cells.flatMap((c, i) => (c ? [] : [i]));
    if (bugs < onCall.maxBugs && empty.length) {
      const [r, rngSeed] = rand(s.rngSeed);
      const index = empty[Math.floor(r * empty.length)];
      s = { ...s, rngSeed, board: place(s.board, index, { kind: 'item', chain: 'code', tier: 1 }) };
      event = { type: 'paged', index, at: now };
    }
  }

  if (s.surveyEndsAt && now >= s.surveyEndsAt) s = { ...s, surveyEndsAt: 0 };
  if (!s.surveyEndsAt && now >= s.nextSurveyAt) {
    s = { ...s, surveyEndsAt: now + economy.survey.openForMs, nextSurveyAt: now + economy.survey.everyMs };
  }

  if (s.pendingGenerators.length) s = placeGenerators(s);

  if (s === state && event === state.event) return state.updatedAt === now ? state : { ...state, updatedAt: now };
  return { ...s, updatedAt: now, event };
}

// ---- Actions -----------------------------------------------------------------

function spawn(state: GameState, index: number, chain: ChainId, now: number): GameState {
  const target = nearestEmpty(state.board, index);
  if (target === -1) return withEvent(state, { type: 'denied', index, reason: 'board-full', at: now });

  const hours = spendHours(state, economy.hours.costPerTap, now, -economy.hours.overtimeMax);
  if (!hours) return withEvent(state, { type: 'denied', index, reason: 'no-hours', at: now });

  const [t, rngSeed] = pickWeighted(state.rngSeed, generatorDrops(state, now));
  const tier = Math.min(t + 1, maxTierOf(chain));
  let s: GameState = {
    ...state,
    ...hours,
    rngSeed,
    board: place(state.board, target, { kind: 'item', chain, tier }),
    event: { type: 'spawn', index: target, from: index, at: now },
  };

  // Overtime: every hour worked below zero counts towards burnout.
  if (hours.hours < 0) {
    const window = now - economy.hours.burnoutWindowMs;
    const overtimeLog = [...s.overtimeLog.filter((t) => t > window), now];
    s = { ...s, overtimeLog };
    if (overtimeLog.length > economy.hours.burnoutThreshold && !isBurntOut(s, now)) {
      s = { ...s, burntOutUntil: now + economy.hours.burnoutMs, overtimeLog: [], event: { type: 'burnout', at: now } };
    } else if (state.hours >= 0) {
      s = { ...s, event: { type: 'overtime', at: now } };
    }
  }
  return s;
}

function deliver(state: GameState, orderId: number, now: number): GameState {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return state;
  const cells = matchItems(state.board, order.items, state.selected);
  if (cells.includes(-1)) return state;

  const amount = payout(state, order, now);
  const xp = order.items.reduce((sum, i) => sum + economy.xp.perItem(i.tier), 0);
  const big =
    order.items.length >= economy.shares.bigOrderItems || order.items.some((i) => i.tier >= economy.shares.bigOrderTier);
  const shareCount = (big ? 1 : 0) + (rules(state).sharesPerDelivery ?? 0);
  const who = getCharacter(order.characterId);

  let s: GameState = {
    ...state,
    orders: state.orders.filter((o) => o.id !== order.id),
    board: cells.reduce((b, i) => place(b, i, null), state.board),
    selected: state.selected !== null && cells.includes(state.selected) ? null : state.selected,
    salary: state.salary + amount,
    stats: {
      ordersThisChapter: state.stats.ordersThisChapter + 1,
      ordersTotal: state.stats.ordersTotal + 1,
      deliveredTo: { ...state.stats.deliveredTo, [order.characterId]: (state.stats.deliveredTo[order.characterId] ?? 0) + 1 },
    },
    event: { type: 'deliver', orderId: order.id, amount, at: now },
  };
  s = grant(s, shareCount, `Delivery for ${who?.name ?? 'the team'}`, now);

  const [mine, s1] = pick(s.rngSeed, deliverLines);
  const [thanks, s2] = who ? pick(s1, thanksLinesFor(who)) : [{ text: 'Thanks!' }, s1];
  s = post({ ...s, rngSeed: s2 }, [
    { from: 'you', text: mine, at: now, items: order.items },
    { from: order.characterId, text: thanks.text, at: now },
  ]);
  s = postNewOrders(s, [order.characterId], now);
  return gainXp(s, xp, now);
}

function buyTask(state: GameState, taskId: string, now: number): GameState {
  const space = getSpace(getStage(state.stage).spaceId);
  const task = space.tasks.find((t) => t.id === taskId);
  const done = state.office[space.id] ?? [];
  if (!task || done.includes(taskId)) return state;
  if (state.salary < task.cost) return withEvent(state, { type: 'denied', index: -1, reason: 'no-salary', at: now });

  const nowDone = [...done, taskId];
  let s: GameState = {
    ...state,
    salary: state.salary - task.cost,
    office: { ...state.office, [space.id]: nowDone },
    event: { type: 'bought', taskId, at: now },
  };
  if (nowDone.length === space.tasks.length) {
    s = { ...s, shares: s.shares + space.completionShares };
    s = notify(s, { type: 'space-done', spaceId: space.id, shares: space.completionShares });
  }
  return gainXp(s, task.xp, now);
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'tick':
      return tick(state, action.now);

    case 'tap': {
      const s = tick(state, action.now);
      const cell = s.board.cells[action.index];
      if (cell?.kind === 'generator') return spawn({ ...s, selected: action.index }, action.index, cell.chain, action.now);
      return { ...s, selected: cell ? action.index : null };
    }

    case 'drop': {
      const { board, result } = drop(state.board, action.from, action.to);
      if (result === 'none') return state;
      return {
        ...state,
        board,
        selected: action.to,
        event: result === 'merge' ? { type: 'merge', index: action.to, at: action.now } : state.event,
      };
    }

    case 'deliver':
      return deliver(tick(state, action.now), action.orderId, action.now);

    case 'sell': {
      const cell = state.board.cells[action.index];
      if (cell?.kind !== 'item') return state;
      const amount = economy.sellValue(cell.tier);
      return {
        ...state,
        board: place(state.board, action.index, null),
        selected: null,
        salary: state.salary + amount,
        event: { type: 'sell', amount, at: action.now },
      };
    }

    case 'buyTask':
      return buyTask(state, action.taskId, action.now);

    case 'refillHours': {
      if (state.shares < economy.shares.refillCost) return withEvent(state, { type: 'denied', index: -1, reason: 'no-shares', at: action.now });
      return {
        ...state,
        shares: state.shares - economy.shares.refillCost,
        hours: economy.hours.cap,
        hoursAnchor: action.now,
        burntOutUntil: 0,
        overtimeLog: [],
        event: { type: 'refilled', at: action.now },
      };
    }

    case 'upgradeItem': {
      const cell = state.board.cells[action.index];
      if (cell?.kind !== 'item' || cell.tier >= maxTierOf(cell.chain)) return state;
      if (state.shares < economy.shares.upgradeCost) return withEvent(state, { type: 'denied', index: action.index, reason: 'no-shares', at: action.now });
      return {
        ...state,
        shares: state.shares - economy.shares.upgradeCost,
        board: place(state.board, action.index, { ...cell, tier: cell.tier + 1 }),
        event: { type: 'upgraded', index: action.index, at: action.now },
      };
    }

    case 'answerSurvey': {
      if (!state.surveyEndsAt || action.now >= state.surveyEndsAt) return state;
      const s = { ...state, surveyEndsAt: 0, moodUntil: action.now + economy.survey.moodMs };
      return grant(s, economy.survey.rewardShares, 'Engagement survey', action.now);
    }

    case 'dismissNotice': {
      const [first, ...rest] = state.notices;
      if (!first || first.type === 'choose-path') return state;
      let s: GameState = { ...state, notices: rest };
      if (first.type === 'review') {
        const next = nextStage(first.stage);
        if (first.stage === 'uni') s = notify(s, { type: 'choose-path' });
        else if (next && s.path) s = enterStage(s, next, s.path, action.now);
      }
      return s;
    }

    case 'choosePath': {
      if (state.notices[0]?.type !== 'choose-path') return state;
      return enterStage({ ...state, notices: state.notices.slice(1) }, 'first-job', action.path, action.now);
    }

    case 'readChat':
      return { ...state, chatReadAt: action.now };

    case 'deselect':
      return state.selected === null ? state : { ...state, selected: null };

    case 'reset':
      return action.state;
  }
}
