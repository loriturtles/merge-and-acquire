// Everything that depends on where you are in your career: stage + path.

import { economy } from '../config/economy';
import type { ChainId } from '../content/chains';
import { getPath, getStage, stages, uniStage, type PathRules, type StageId } from '../content/paths';
import { annualSalary } from '../content/salaries';
import type { GameState, Order } from './types';

type CareerState = Pick<GameState, 'stage' | 'path' | 'titleIndex'>;

export function titlesFor(stage: StageId, path: GameState['path']): string[] {
  if (stage === 'uni' || !path) return uniStage.titles;
  return getPath(path).stages[stage].titles;
}

export function currentTitle(s: CareerState): string {
  const titles = titlesFor(s.stage, s.path);
  return titles[Math.min(s.titleIndex, titles.length - 1)];
}

/** Chains unlocked so far, oldest first; earlier chains stay available. */
export function chainsByStage(s: Pick<GameState, 'stage' | 'path'>): ChainId[][] {
  const out: ChainId[][] = [uniStage.chains];
  if (!s.path) return out;
  const path = getPath(s.path);
  for (const st of stages) {
    if (st.id === 'uni') continue;
    out.push(path.stages[st.id].chains);
    if (st.id === s.stage) break;
  }
  return out;
}

export function unlockedChains(s: Pick<GameState, 'stage' | 'path'>): ChainId[] {
  return chainsByStage(s).flat();
}

export function cast(s: Pick<GameState, 'stage' | 'path'>): string[] {
  return s.stage === 'uni' || !s.path ? uniStage.cast : getPath(s.path).cast;
}

export function rules(s: Pick<GameState, 'path'>): PathRules {
  return s.path ? getPath(s.path).rules : {};
}

/** One fortnightly paycheck at a title. */
export function paycheck(title: string): number {
  return Math.round(annualSalary(title) / economy.payday.periodsPerYear);
}

export function wage(s: CareerState): number {
  return paycheck(currentTitle(s));
}

export function isBurntOut(s: Pick<GameState, 'burntOutUntil'>, now: number): boolean {
  return now < s.burntOutUntil;
}

export function moodActive(s: Pick<GameState, 'moodUntil'>, now: number): boolean {
  return now < s.moodUntil;
}

/** What a delivery pays right now, after the path twist, survey mood and burnout. */
export function payout(s: GameState, order: Order, now: number): number {
  let pay = order.reward * (rules(s).orderRewardMultiplier ?? 1);
  if (moodActive(s, now)) pay *= economy.survey.moodPayMultiplier;
  if (isBurntOut(s, now)) pay *= economy.hours.burnoutPayMultiplier;
  return Math.round(pay);
}

export function generatorDrops(s: GameState, now: number): number[] {
  if (isBurntOut(s, now)) return [100];
  return rules(s).generatorDrops ?? [100];
}

export function age(s: CareerState): number {
  return getStage(s.stage).startAge + s.titleIndex;
}
