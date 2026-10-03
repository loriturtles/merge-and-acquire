import type { Dispatch } from 'react';
import { economy } from '../config/economy';
import { getChain, getTier, maxTierOf } from '../content/chains';
import type { Action } from '../game/state';
import type { GameEvent, GameState } from '../game/types';
import { pieceArt, pieceName } from './art';
import { formatMoney, withArticle } from './format';

export function SelectedBar({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  const piece = state.selected === null ? null : state.board.cells[state.selected];

  if (!piece) {
    return (
      <div className="selected card selected-empty">
        <span>Tap the backpack or microwave to start working. Drag two matching items together to merge them.</span>
      </div>
    );
  }

  const chain = getChain(piece.chain);
  let detail: string;
  if (piece.kind === 'generator') {
    detail = `Tap for ${chain.name.toLowerCase()} items · ${economy.hours.costPerTap}h each.`;
  } else {
    const max = maxTierOf(piece.chain);
    detail =
      piece.tier < max
        ? `${chain.name} · tier ${piece.tier} of ${max}. Merge two for ${withArticle(getTier(piece.chain, piece.tier + 1).name)}.`
        : `${chain.name} · tier ${max} of ${max}. Top of the chain: deliver it or sell it.`;
  }

  return (
    <div className="selected card">
      <img src={pieceArt(piece)} alt="" width={46} height={46} />
      <div className="selected-text">
        <span className="selected-name">{pieceName(piece)}</span>
        <span className="selected-detail">{detail}</span>
      </div>
      {piece.kind === 'item' && (
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'sell', index: state.selected!, now: Date.now() })}>
          Sell {formatMoney(economy.sellValue(piece.tier))}
        </button>
      )}
    </div>
  );
}

const tabs = [
  {
    id: 'desk',
    label: 'Desk',
    icon: <><rect x="3" y="3" width="7" height="7" rx="2.5" /><rect x="14" y="3" width="7" height="7" rx="2.5" /><rect x="3" y="14" width="7" height="7" rx="2.5" /><rect x="14" y="14" width="7" height="7" rx="2.5" /></>,
  },
  { id: 'office', label: 'Office', icon: <path d="M4 21 V6 Q4 5 5 4.6 L12 2 L19 4.6 Q20 5 20 6 V21 Z M9 21 V16 H15 V21" /> },
  {
    id: 'team',
    label: 'Team',
    icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20 C3 15.5 6 14 9 14 C12 14 15 15.5 15.5 20" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14 C19.5 14 21.5 15.5 21.5 19" /></>,
  },
  { id: 'shares', label: 'Shares', icon: <path d="M4 18 L9 12 L13 15 L20 7 M15 7 H20 V12" /> },
];

const comingSoon: Record<string, string> = {
  office: 'Rebuilding the share house opens soon.',
  team: 'Your team page is still in onboarding.',
  shares: 'Shares start vesting at your first job.',
};

export function BottomNav({ onSoon }: { onSoon: (msg: string) => void }) {
  return (
    <nav className="nav card" aria-label="Main">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`nav-tab${t.id === 'desk' ? ' nav-active' : ''}`}
          aria-current={t.id === 'desk' ? 'page' : undefined}
          onClick={() => t.id !== 'desk' && onSoon(comingSoon[t.id])}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {t.icon}
          </svg>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

function messageFor(event: GameEvent): string | null {
  switch (event.type) {
    case 'payday':
      return event.count > 1 ? `Payday ×${event.count}! +${formatMoney(event.amount)}` : `Payday! +${formatMoney(event.amount)}`;
    case 'deliver':
      return `Delivered! +${formatMoney(event.amount)} bonus`;
    case 'sell':
      return `Sold for ${formatMoney(event.amount)}`;
    case 'denied':
      return event.reason === 'no-hours' ? 'Out of hours. Take a break, they refill.' : "Desk's full. Merge or sell something.";
    default:
      return null;
  }
}

const TOAST_MS = 2200;

/** Shows the latest game event or extra message for a couple of seconds. `now` advances with the game clock. */
export function Toast({ event, extra, now }: { event: GameEvent | null; extra: { text: string; at: number } | null; now: number }) {
  const fromEvent = event && messageFor(event);
  const candidates = [fromEvent ? { text: fromEvent, at: event.at } : null, extra].filter((t) => t !== null);
  const shown = candidates.sort((a, b) => b.at - a.at)[0];

  if (!shown || now - shown.at > TOAST_MS) return null;
  return (
    <div className="toast" role="status" key={shown.at}>
      {shown.text}
    </div>
  );
}
