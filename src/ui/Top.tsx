import { economy } from '../config/economy';
import { getStage } from '../content/paths';
import { age, currentTitle, isBurntOut } from '../game/career';
import { msToNextHour } from '../game/hours';
import type { GameState } from '../game/types';
import { iconArt } from './art';
import { formatClock, formatCountdown, formatMoney } from './format';

export function Header({ state }: { state: GameState }) {
  const stage = getStage(state.stage);
  const need = economy.xp.toNext(state.level);
  const pct = Math.min(100, (state.xp / need) * 100);
  return (
    <header className="header">
      <div className="header-left">
        <span className="caption">
          CHAPTER {stage.chapter} · {stage.space.toUpperCase()}
        </span>
        <h1 className="title">{currentTitle(state)}</h1>
      </div>
      <div className="header-right">
        <span className="caption">
          Lv {state.level} · age {age(state)}
        </span>
        <div className="xp" role="progressbar" aria-label="Experience" aria-valuenow={state.xp} aria-valuemax={need}>
          <div className="xp-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </header>
  );
}

export function StatPills({ state, onShares }: { state: GameState; onShares: () => void }) {
  const now = state.updatedAt;
  const toNext = msToNextHour(state, now);
  const cap = economy.hours.cap;
  const burnt = isBurntOut(state, now);
  const overtime = state.hours < 0;
  const vesting = state.vesting.reduce((sum, g) => sum + g.amount, 0);

  let hoursSub = toNext === null ? `of ${cap} this week` : `+1h in ${formatClock(toNext)}`;
  if (overtime) hoursSub = `overtime · ${formatClock(toNext ?? 0)}`;
  if (burnt) hoursSub = `burnt out ${formatClock(state.burntOutUntil - now)}`;

  return (
    <div className="pills">
      <div className={`pill${burnt ? ' pill-burnt' : overtime ? ' pill-overtime' : state.hours === 0 ? ' pill-alert' : ''}`}>
        <img src={iconArt('hours')} alt="" width={28} height={28} />
        <div className="pill-text">
          <span className="pill-value">{overtime ? `OT ${-state.hours}h` : `${state.hours}h`}</span>
          <span className="pill-sub">{hoursSub}</span>
        </div>
      </div>
      <div className="pill">
        <img src={iconArt('salary')} alt="" width={28} height={28} />
        <div className="pill-text">
          <span className="pill-value">{formatMoney(state.salary)}</span>
          <span className="pill-sub">Payday {formatCountdown(state.nextPaydayAt - now)}</span>
        </div>
      </div>
      <button className="pill pill-button" onClick={onShares}>
        <img src={iconArt('shares')} alt="" width={28} height={28} />
        <div className="pill-text">
          <span className="pill-value">{state.shares}</span>
          <span className="pill-sub">{vesting ? `+${vesting} vesting` : '0 vesting'}</span>
        </div>
      </button>
    </div>
  );
}
