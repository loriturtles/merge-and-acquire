import type { Dispatch } from 'react';
import { getTier } from '../content/chains';
import { characters } from '../content/characters';
import { canFill } from '../game/orders';
import type { Action } from '../game/state';
import type { GameState } from '../game/types';
import { itemArt } from './art';
import { formatAgo, formatMoney } from './format';

const avatarColours = {
  red: ['#ffb3a6', '#f04f3c', '#a32a1e'],
  orange: ['#ffd0a8', '#ff8a3a', '#c4561a'],
  yellow: ['#fff4bd', '#ffc93a', '#cf8f0c'],
  green: ['#b8f6d4', '#3fbf82', '#1f7a50'],
  blue: ['#d3e7ff', '#3f86f2', '#1f4fa8'],
  purple: ['#e6d8ff', '#8f63f0', '#4f2fb0'],
  pink: ['#ffdcea', '#ff8cb8', '#c94f80'],
} as const;

export function TeamChat({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  const ready = state.orders.filter((o) => canFill(state.board, o)).length;
  return (
    <section className="chat card" aria-label="Team requests">
      <div className="chat-head">
        <span className="chat-channel"># team-requests</span>
        {ready > 0 && <span className="badge badge-green">{ready} ready</span>}
      </div>
      {state.orders.map((order) => {
        const who = characters.find((c) => c.id === order.characterId)!;
        const fillable = canFill(state.board, order);
        const [hi, base, lo] = avatarColours[who.colour];
        const name = getTier(order.chain, order.tier).name;
        return (
          <div key={order.id} className={`msg${fillable ? ' msg-ready' : ''}`}>
            <span
              className="avatar"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${hi}, ${base} 55%, ${lo})`,
                color: who.colour === 'yellow' ? '#2a2140' : '#fff',
              }}
            >
              {who.initials}
            </span>
            <div className="msg-body">
              <span className="msg-meta">
                <b>{who.name}</b> <span className="msg-team">{who.team} · {formatAgo(state.updatedAt - order.postedAt)}</span>
              </span>
              <span className="msg-text">{order.text}</span>
            </div>
            {fillable ? (
              <>
                <img className="msg-item" src={itemArt(order.chain, order.tier)} alt={name} width={30} height={30} />
                <button className="btn btn-primary btn-deliver" onClick={() => dispatch({ type: 'deliver', orderId: order.id, now: Date.now() })}>
                  Deliver
                </button>
              </>
            ) : (
              <div className="reward" title={name}>
                <img src={itemArt(order.chain, order.tier)} alt={name} width={30} height={30} />
                <span>+{formatMoney(order.reward)}</span>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
