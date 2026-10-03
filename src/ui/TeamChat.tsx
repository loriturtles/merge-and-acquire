import type { Dispatch } from 'react';
import { getTier } from '../content/chains';
import { characters } from '../content/characters';
import { canFill } from '../game/orders';
import type { Action } from '../game/state';
import type { GameState } from '../game/types';
import { avatarArt, itemArt } from './art';
import { formatAgo, formatMoney } from './format';

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
        const name = getTier(order.chain, order.tier).name;
        return (
          <div key={order.id} className={`msg${fillable ? ' msg-ready' : ''}`}>
            <img className="avatar" src={avatarArt(who.id)} alt="" width={32} height={32} draggable={false} />
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
