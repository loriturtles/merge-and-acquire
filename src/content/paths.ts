import type { ChainId } from './chains';

/** Life stages. Chapter numbers match CLAUDE.md §2; later chapters arrive in later milestones. */
export type StageId = 'uni' | 'first-job' | 'junior';
export type PathId = 'engineer' | 'product' | 'sales' | 'founder';

export interface StageDef {
  id: StageId;
  chapter: number;
  name: string;
  /** The space you rebuild in the Office tab (see office.ts). */
  spaceId: string;
  space: string;
  ages: string;
  /** Your age shown in the header at the start of the chapter. */
  startAge: number;
}

export const stages: StageDef[] = [
  { id: 'uni', chapter: 1, name: 'Uni', spaceId: 'share-house', space: 'The share house', ages: '18–21', startAge: 18 },
  { id: 'first-job', chapter: 2, name: 'First job', spaceId: 'garage-startup', space: 'The garage startup', ages: '22–24', startAge: 22 },
  { id: 'junior', chapter: 3, name: 'Junior', spaceId: 'open-plan-floor', space: 'The open-plan floor', ages: '25–29', startAge: 25 },
];

/** Rule changes a path makes to the core loop. Anything left out uses economy.ts. */
export interface PathRules {
  /** Multiplies every delivery bonus. */
  orderRewardMultiplier?: number;
  /** Overrides economy.orders.itemCountWeights. */
  itemCountWeights?: number[];
  /** Overrides the chapter's generator drop weights (index 0 = tier 1). */
  generatorDrops?: number[];
  /** Engineer: a pager drops a Bug on your desk this often. */
  onCall?: { everyMs: number; maxBugs: number };
  /** Founder: unvested shares granted per delivery. */
  sharesPerDelivery?: number;
  /** Multiplies share grants from promotions and reviews. */
  shareGrantMultiplier?: number;
}

export interface PathDef {
  id: PathId;
  name: string;
  /** One line on the path-choice card. */
  pitch: string;
  twist: { name: string; description: string };
  /** Titles and the chain added at each stage after Uni. */
  stages: Record<Exclude<StageId, 'uni'>, { titles: string[]; chains: ChainId[] }>;
  /** Character ids who message you on this path (see characters.ts). */
  cast: string[];
  rules: PathRules;
}

const MINUTE = 60_000;

export const uniStage = {
  titles: ['Fresher', 'Second-year', 'Final-year', 'Honours student', 'Tutor'],
  chains: ['study', 'food'] as ChainId[],
  cast: ['mia', 'josh', 'lin', 'dev', 'brooks'],
};

export const paths: PathDef[] = [
  {
    id: 'engineer',
    name: 'Engineer',
    pitch: 'Write code, fix bugs, get paged at 3am. Best salary.',
    twist: { name: 'On call', description: 'Your pager drops bugs onto your desk every few minutes.' },
    stages: {
      'first-job': { titles: ['SWE intern', 'Junior engineer'], chains: ['code'] },
      junior: { titles: ['Software engineer', 'Senior engineer'], chains: ['data'] },
    },
    cast: ['kai', 'sam', 'nina', 'jordan', 'byte'],
    rules: { onCall: { everyMs: 4 * MINUTE, maxBugs: 3 } },
  },
  {
    id: 'product',
    name: 'Product',
    pitch: 'Own the roadmap. Own the meetings. Own nothing else.',
    twist: { name: 'Stakeholders', description: 'Requests ask for more items at once, and pay 1.5×.' },
    stages: {
      'first-job': { titles: ['APM intern', 'Associate PM'], chains: ['strategy'] },
      junior: { titles: ['Product manager', 'Senior PM'], chains: ['inbox'] },
    },
    cast: ['ava', 'sam', 'nina', 'jordan', 'byte'],
    rules: { orderRewardMultiplier: 1.5, itemCountWeights: [20, 50, 30] },
  },
  {
    id: 'sales',
    name: 'Sales',
    pitch: 'Smile and dial. The base is low; the upside is not.',
    twist: { name: 'Commission', description: 'Payday is base salary only. Every delivery pays 3×.' },
    stages: {
      'first-job': { titles: ['Sales intern', 'Sales development rep'], chains: ['swag'] },
      junior: { titles: ['Account executive', 'Senior AE'], chains: ['coffee'] },
    },
    cast: ['ruth', 'lee', 'marco', 'nina', 'byte'],
    rules: { orderRewardMultiplier: 3 },
  },
  {
    id: 'founder',
    name: 'Founder',
    pitch: 'Drop out of nothing. Build something. Pay yourself in hope.',
    twist: { name: 'Equity-rich, cash-poor', description: 'Tiny salary. Generators can drop tier 2–3 items, and every delivery grants a share.' },
    stages: {
      'first-job': { titles: ['Solo founder', 'Pre-seed founder'], chains: ['code'] },
      junior: { titles: ['Seed-stage CEO', 'Series A CEO'], chains: ['funding'] },
    },
    cast: ['kai', 'theo', 'marco', 'sam', 'byte'],
    rules: { generatorDrops: [70, 22, 8], sharesPerDelivery: 1, shareGrantMultiplier: 2 },
  },
];

export function getStage(id: StageId): StageDef {
  return stages.find((s) => s.id === id)!;
}

export function getPath(id: PathId): PathDef {
  const path = paths.find((p) => p.id === id);
  if (!path) throw new Error(`Unknown path: ${id}`);
  return path;
}

export function nextStage(id: StageId): StageId | null {
  const i = stages.findIndex((s) => s.id === id);
  return stages[i + 1]?.id ?? null;
}
