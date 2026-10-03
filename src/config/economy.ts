// Every tunable number lives here. Starting values are guesses for playtesting.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const economy = {
  board: {
    cols: 7,
    rows: 7,
    /** Rows used when the screen is tall enough (see useBoardRows). */
    tallRows: 8,
    maxTier: 6,
  },

  hours: {
    cap: 40,
    costPerTap: 1,
    refillEveryMs: 2 * MINUTE,
    /** At 0 hours you can keep working into overtime, down to −overtimeMax. */
    overtimeMax: 15,
    /** More than this many overtime hours in a rolling window burns you out. */
    burnoutThreshold: 15,
    burnoutWindowMs: 24 * HOUR,
    burnoutMs: 30 * MINUTE,
    /** Orders pay this much while burnt out. */
    burnoutPayMultiplier: 0.5,
  },

  xp: {
    /** XP for each delivered item. */
    perItem: (tier: number) => 3 * 2 ** (tier - 1),
    /** XP needed to go from this level to the next. */
    toNext: (level: number) => Math.round(40 * 1.3 ** (level - 1)),
  },

  shares: {
    vestMs: 24 * HOUR,
    /** Unvested grant for each promotion. */
    promotionGrant: (level: number) => 2 + level,
    /** Orders with this many items, or any item at this tier or above, grant a share. */
    bigOrderItems: 3,
    bigOrderTier: 5,
    refillCost: 3,
    upgradeCost: 2,
  },

  review: {
    /** Orders expected per chapter; filling more gives a better rating. */
    targetOrders: { uni: 15, 'first-job': 12, junior: 15 } as Record<string, number>,
    /** Vested shares per rating (index matches events.reviewRatings). */
    shares: [3, 6, 10, 15],
  },

  survey: {
    firstAfterMs: 10 * MINUTE,
    everyMs: 48 * HOUR,
    openForMs: 6 * HOUR,
    moodMs: 24 * HOUR,
    moodPayMultiplier: 1.25,
    rewardShares: 2,
  },

  payday: {
    everyMs: 4 * HOUR,
    /** Each payday pays one US fortnightly paycheck: annual salary ÷ 26. */
    periodsPerYear: 26,
    /** Paydays that can pile up while the app is closed. */
    maxMissed: 3,
  },

  orders: {
    visible: 3,
    /** Bonus for delivering an item = base × 2^(tier − 1). */
    bonusBase: 10,
    /** Weighting of requested tiers (index 0 = tier 1). Favours tiers that are reachable. */
    tierWeights: [0, 30, 30, 22, 12, 6],
    /** Share of requests that use the newest chapter's chains (the rest use older chains). */
    newestChainShare: 0.7,
    /** Chance weights for how many items a request asks for (index 0 = 1 item). */
    itemCountWeights: [55, 35, 10],
    /** Messages kept in the chat history. */
    chatHistory: 60,
  },

  /** Selling an item pays 2^tier. */
  sellValue: (tier: number) => 2 ** tier,

  /** Bonus paid for delivering an item of this tier. */
  orderBonus: (tier: number) => economy.orders.bonusBase * 2 ** (tier - 1),

  start: {
    salary: 0,
    shares: 0,
  },
} as const;

export type Economy = typeof economy;
