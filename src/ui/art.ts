import { getChain, getTier, type ChainId } from '../content/chains';
import type { Piece } from '../game/types';

// The SVGs stay in /assets exactly as supplied; Vite turns each into a URL.
const urls = import.meta.glob<string>('/assets/**/*.svg', { eager: true, query: '?url', import: 'default' });

function url(path: string): string {
  const found = urls[`/${path}`];
  if (!found) throw new Error(`Missing art: ${path}`);
  return found;
}

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const itemArt = (chain: ChainId, tier: number) => url(getTier(chain, tier).file);
export const generatorArt = (chain: ChainId) => url(`assets/generators/${slug(getChain(chain).generator)}.svg`);
export const officeArt = (spaceId: string, taskId: string) => url(`assets/office/${spaceId}-${taskId}.svg`);
/** Falls back to a neutral icon so a missing avatar never breaks the chat. */
export const avatarArt = (characterId: string) => urls[`/assets/avatars/${characterId}.svg`] ?? url('assets/icons/shares.svg');
export const iconArt =(name: 'hours' | 'salary' | 'shares') => url(`assets/icons/${name}.svg`);

export function pieceArt(piece: Piece): string {
  return piece.kind === 'item' ? itemArt(piece.chain, piece.tier) : generatorArt(piece.chain);
}

export function pieceName(piece: Piece): string {
  return piece.kind === 'item' ? getTier(piece.chain, piece.tier).name : getChain(piece.chain).generator;
}
