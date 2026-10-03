import data from '../../data/chains.json';

export type ChainId =
  | 'study'
  | 'food'
  | 'code'
  | 'swag'
  | 'inbox'
  | 'coffee'
  | 'strategy'
  | 'data'
  | 'hiring'
  | 'culture'
  | 'funding'
  | 'garden';

export interface TierDef {
  tier: number;
  name: string;
  /** Path relative to the project root, e.g. assets/items/study-1-highlighter.svg */
  file: string;
}

export interface ChainDef {
  id: ChainId;
  chapter: string;
  name: string;
  generator: string;
  tiers: TierDef[];
}

export const chains = data.chains as ChainDef[];

const byId = new Map(chains.map((c) => [c.id, c]));

export function getChain(id: ChainId): ChainDef {
  const chain = byId.get(id);
  if (!chain) throw new Error(`Unknown chain: ${id}`);
  return chain;
}

export function getTier(id: ChainId, tier: number): TierDef {
  const def = getChain(id).tiers.find((t) => t.tier === tier);
  if (!def) throw new Error(`Unknown tier: ${id} ${tier}`);
  return def;
}

export function maxTierOf(id: ChainId): number {
  return getChain(id).tiers.length;
}
