import type { Dispatch } from 'react';
import { economy } from '../config/economy';
import { getCharacter } from '../content/characters';
import { getSpace, spaces } from '../content/office';
import { getPath, getStage, stages } from '../content/paths';
import { salaries } from '../content/salaries';
import { cast, currentTitle, isBurntOut, paycheck, titlesFor } from '../game/career';
import type { Action } from '../game/state';
import type { GameState } from '../game/types';
import { avatarArt, iconArt, officeArt } from './art';
import { formatCountdown, formatMoney } from './format';

export function OfficeView({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  const space = getSpace(getStage(state.stage).spaceId);
  const done = state.office[space.id] ?? [];
  const earlier = spaces.filter((s) => s.id !== space.id && stages.some((st) => st.spaceId === s.id && st.chapter < getStage(state.stage).chapter));

  return (
    <section className="screen-scroll" aria-label="Office">
      <div className="room card">
        <div className="room-head">
          <span className="chat-channel">{space.name}</span>
          <span className="badge badge-green">
            {done.length} of {space.tasks.length}
          </span>
        </div>
        <div className="room-floor">
          {space.tasks.map((t) => (
            <img
              key={t.id}
              src={officeArt(space.id, t.id)}
              alt={t.name}
              className={`room-piece${done.includes(t.id) ? '' : ' room-empty'}`}
              draggable={false}
            />
          ))}
        </div>
        <p className="room-line">
          {done.length === space.tasks.length ? space.doneLine : `Finish the space for +${space.completionShares} shares.`}
        </p>
      </div>
      <div className="task-list">
        {space.tasks.map((t) => {
          const bought = done.includes(t.id);
          return (
            <div key={t.id} className={`task card${bought ? ' task-done' : ''}`}>
              <img src={officeArt(space.id, t.id)} alt="" width={48} height={48} />
              <div className="task-text">
                <span className="task-name">{t.name}</span>
                <span className="task-sub">+{t.xp} XP</span>
              </div>
              {bought ? (
                <span className="task-status">Done</span>
              ) : (
                <button
                  className="btn btn-primary btn-task"
                  disabled={state.salary < t.cost}
                  onClick={() => dispatch({ type: 'buyTask', taskId: t.id, now: Date.now() })}
                >
                  {formatMoney(t.cost)}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {earlier.length > 0 && (
        <p className="screen-note">
          Earlier spaces:{' '}
          {earlier.map((s) => `${s.name} (${(state.office[s.id] ?? []).length}/${s.tasks.length})`).join(', ')}
        </p>
      )}
    </section>
  );
}

export function TeamView({ state }: { state: GameState }) {
  const path = state.path ? getPath(state.path) : null;
  const titles = titlesFor(state.stage, state.path);
  const title = currentTitle(state);
  return (
    <section className="screen-scroll" aria-label="Team">
      {path && (
        <div className="card info-card">
          <span className="modal-kicker">YOUR PATH</span>
          <span className="info-title">{path.name}</span>
          <span className="info-text">
            <b>{path.twist.name}:</b> {path.twist.description}
          </span>
        </div>
      )}
      <div className="card info-card">
        <span className="modal-kicker">CAREER LADDER · {getStage(state.stage).name.toUpperCase()}</span>
        {titles.map((t) => (
          <div key={t} className={`ladder-row${t === title ? ' ladder-current' : ''}`}>
            <span className="ladder-title">{t}</span>
            <span className="ladder-pay">{formatMoney(salaries[t].annual)}/yr</span>
            <span className="ladder-source">
              {formatMoney(paycheck(t))} per paycheck · {salaries[t].source}
            </span>
          </div>
        ))}
      </div>
      <div className="card info-card">
        <span className="modal-kicker">#TEAM-REQUESTS MEMBERS</span>
        {cast(state).map((id) => {
          const c = getCharacter(id);
          if (!c) return null;
          return (
            <div key={id} className="member">
              <img src={avatarArt(id)} alt="" width={44} height={44} />
              <span className="member-text">
                <b>{c.name}</b>
                <span>{c.team}</span>
              </span>
              <span className="member-count">{state.stats.deliveredTo[id] ?? 0} delivered</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SharesView({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  const now = state.updatedAt;
  const vesting = [...state.vesting].sort((a, b) => a.vestAt - b.vestAt);
  const unvested = vesting.reduce((sum, g) => sum + g.amount, 0);
  const tired = state.hours < economy.hours.cap || isBurntOut(state, now);
  return (
    <section className="screen-scroll" aria-label="Shares">
      <div className="card info-card shares-hero">
        <img src={iconArt('shares')} alt="" width={64} height={64} />
        <div>
          <span className="shares-big">{state.shares}</span>
          <span className="info-text">vested · {unvested} unvested</span>
        </div>
      </div>
      <div className="card info-card">
        <span className="modal-kicker">CASH IN</span>
        <div className="spend-row">
          <span className="spend-text">
            <b>Long weekend</b>
            <span>Refill all hours and clear burnout.</span>
          </span>
          <button
            className="btn btn-primary btn-task"
            disabled={state.shares < economy.shares.refillCost || !tired}
            onClick={() => dispatch({ type: 'refillHours', now: Date.now() })}
          >
            {economy.shares.refillCost} shares
          </button>
        </div>
        <div className="spend-row">
          <span className="spend-text">
            <b>Fast-track an item</b>
            <span>Select an item on your desk and tap +1 to bump it up a tier.</span>
          </span>
          <span className="spend-cost">{economy.shares.upgradeCost} shares</span>
        </div>
      </div>
      <div className="card info-card">
        <span className="modal-kicker">VESTING SCHEDULE</span>
        {vesting.length === 0 && <span className="info-text">Nothing vesting. Promotions, big requests and reviews grant shares.</span>}
        {vesting.map((g, i) => (
          <div key={i} className="vest-row">
            <span className="vest-amount">+{g.amount}</span>
            <span className="vest-reason">{g.reason}</span>
            <span className="vest-time">{formatCountdown(g.vestAt - now)}</span>
          </div>
        ))}
      </div>
      <p className="screen-note">Hold on to them. Rumour has it share prices do interesting things in the Exec chapter.</p>
    </section>
  );
}
