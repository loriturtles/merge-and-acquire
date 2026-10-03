import { economy } from '../config/economy';
import { getChapter } from '../content/chapters';
import { msToNextHour } from '../game/hours';
import type { GameState } from '../game/types';
import { iconArt } from './art';
import { formatClock, formatCountdown, formatMoney } from './format';

export function Header({ state }: { state: GameState }) {
  const chapter = getChapter(state.chapterId);
  return (
    <header className="header">
      <div className="header-left">
        <span className="caption">
          CHAPTER {chapter.number} · {chapter.space.toUpperCase()}
        </span>
        <h1 className="title">{chapter.titles[state.titleIndex]}</h1>
      </div>
      <div className="header-right">
        <span className="caption">Lv {state.titleIndex + 1} · age 18</span>
        <div className="xp" aria-label="Experience">
          <div className="xp-fill" style={{ width: '4%' }} />
        </div>
      </div>
    </header>
  );
}

export function StatPills({ state }: { state: GameState }) {
  const now = state.updatedAt;
  const toNext = msToNextHour(state, now);
  const cap = economy.hours.cap;
  return (
    <div className="pills">
      <div className={`pill${state.hours === 0 ? ' pill-alert' : ''}`}>
        <img src={iconArt('hours')} alt="" width={28} height={28} />
        <div className="pill-text">
          <span className="pill-value">{state.hours}h</span>
          <span className="pill-sub">{toNext === null ? `of ${cap} this week` : `+1h in ${formatClock(toNext)}`}</span>
        </div>
      </div>
      <div className="pill">
        <img src={iconArt('salary')} alt="" width={28} height={28} />
        <div className="pill-text">
          <span className="pill-value">{formatMoney(state.salary)}</span>
          <span className="pill-sub">Payday {formatCountdown(state.nextPaydayAt - now)}</span>
        </div>
      </div>
      <div className="pill">
        <img src={iconArt('shares')} alt="" width={28} height={28} />
        <div className="pill-text">
          <span className="pill-value">{state.shares}</span>
          <span className="pill-sub">0 vesting</span>
        </div>
      </div>
    </div>
  );
}
