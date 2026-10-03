// Annual US base pay for every job title, from real data (2024–2026).
// Each payday in the game pays one fortnightly paycheck: annual ÷ economy.payday.periodsPerYear.

export interface Salary {
  annual: number;
  /** Total compensation where it's very different from base (equity, bonus). Shown as flavour. */
  totalComp?: number;
  source: string;
}

export const salaries: Record<string, Salary> = {
  // Uni: part-time campus jobs, ~12 hrs/week annualised over 52 weeks.
  Fresher: { annual: 9_300, source: 'BLS OOH, food & beverage serving workers (barista), $14.92/hr, 2024' },
  'Second-year': { annual: 10_200, source: 'BLS OEWS 43-4121, library assistants, $16.36/hr, 2024' },
  'Final-year': { annual: 11_200, source: 'Interpolated, ~$18/hr campus job' },
  'Honours student': { annual: 16_500, source: 'Indeed, research assistant, $21.10/hr × 15 hrs/week, 2026' },
  Tutor: { annual: 44_930, source: 'BLS OOH, teaching assistants, postsecondary, 2024' },

  // First job
  Intern: { annual: 93_600, source: 'Levels.fyi intern pages, ~$45/hr full-time, 2025' },
  'Grad engineer': { annual: 76_251, totalComp: 155_000, source: 'NACE Class of 2025 projections; Levels.fyi 2025' },

  // Junior
  Analyst: { annual: 91_290, totalComp: 110_000, source: 'BLS OOH, operations research analysts, 2024' },
  'Senior analyst': { annual: 119_811, totalComp: 132_000, source: 'Glassdoor, senior data analyst, 2025' },

  // Lead
  'Team lead': { annual: 171_200, source: 'BLS OOH, computer & information systems managers, 2024' },
  'Head of': { annual: 190_000, source: 'Founderpath, VP Engineering at Series A–B, 2025' },

  // Manager (big tech)
  Director: { annual: 374_000, totalComp: 1_400_000, source: 'Levels.fyi, Google L8 engineering manager, 2026' },
  VP: { annual: 405_000, totalComp: 2_000_000, source: 'Levels.fyi, Google L9, 2026' },

  // Exec
  COO: { annual: 191_000, totalComp: 302_000, source: 'Glassdoor average, 2026' },
  'Founder & CEO': { annual: 161_000, source: 'Kruze Consulting, funded-startup founder salaries, 2025' },

  // Retirement
  'Board member': { annual: 105_000, totalComp: 325_000, source: 'Spencer Stuart US Board Index, S&P 500 cash retainer, 2025' },
  Grandparent: { annual: 24_852, source: 'Average retired-worker Social Security benefit, $2,071/mo, 2026' },
};

export function annualSalary(title: string): number {
  const s = salaries[title];
  if (!s) throw new Error(`No salary for title: ${title}`);
  return s.annual;
}
