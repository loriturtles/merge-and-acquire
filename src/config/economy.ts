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
