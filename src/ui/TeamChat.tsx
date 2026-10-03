import { useEffect, useLayoutEffect, useRef, useState, type Dispatch } from 'react';
import { getTier } from '../content/chains';
import { getCharacter } from '../content/characters';
import { getStage } from '../content/paths';
import { cast, payout } from '../game/career';
import { canFill, matchItems } from '../game/orders';
import type { Action } from '../game/state';
import type { ChatMessage, GameState, Order, OrderItem } from '../game/types';
import { avatarArt, itemArt } from './art';
import { formatAgo, formatCountdown, formatMoney } from './format';

const CHANNEL = '# team-requests';

const who = getCharacter;

/** Item icons for a request, each ticked when it's already on the board. */
function ItemIcons({ items, have, size = 28, overlap = false }: { items: OrderItem[]; have: boolean[]; size?: number; overlap?: boolean }) {
  return (
    <span className={`item-icons${overlap ? ' item-icons-overlap' : ''}`}>
      {items.map((it, i) => (
        <span key={i} className="item-icon">
          <img src={itemArt(it.chain, it.tier)} alt={getTier(it.chain, it.tier).name} width={size} height={size} draggable={false} />
          {have[i] && <span className="tick" aria-label="on your desk" />}
        </span>
      ))}
    </span>
  );
}

function orderStatus(state: GameState, order: Order) {
  const have = matchItems(state.board, order.items).map((i) => i !== -1);
  return { have, fillable: have.every(Boolean) };
}

function deliver(dispatch: Dispatch<Action>, orderId: number) {
  return (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'deliver', orderId, now: Date.now() });
  };
}

function PreviewRow({ state, order, dispatch, onOpen }: { state: GameState; order: Order; dispatch: Dispatch<Action>; onOpen: () => void }) {
  const person = who(order.characterId)!;
  const { have, fillable } = orderStatus(state, order);
  return (
    <div className={`msg${fillable ? ' msg-ready' : ''}`} onClick={onOpen} role="button" tabIndex={0}>
      <img className="avatar" src={avatarArt(person.id)} alt="" width={32} height={32} draggable={false} />
      <div className="msg-body">
        <span className="msg-meta">
          <b>{person.name}</b> <span className="msg-team">{person.team} · {formatAgo(state.updatedAt - order.postedAt)}</span>
        </span>
        <span className="msg-text">{order.text}</span>
      </div>
      {fillable ? (
        <>
          <ItemIcons items={order.items} have={[]} size={26} overlap />
          <button className="btn btn-primary btn-deliver" onClick={deliver(dispatch, order.id)}>
            Deliver
          </button>
        </>
      ) : (
        <div className="reward">
          <ItemIcons items={order.items} have={have} size={26} overlap />
          <span>+{formatMoney(payout(state, order, state.updatedAt))}</span>
        </div>
      )}
    </div>
  );
}

function unreadCount(state: GameState): number {
  return state.chat.filter((m) => m.from !== 'you' && m.at > state.chatReadAt).length;
}

export function TeamChat({
  state,
  dispatch,
  onOpen,
  onSurvey,
}: {
  state: GameState;
  dispatch: Dispatch<Action>;
  onOpen: () => void;
  onSurvey: () => void;
}) {
  const ready = state.orders.filter((o) => canFill(state.board, o)).length;
  const unread = unreadCount(state);
  const now = state.updatedAt;
  const surveyOpen = state.surveyEndsAt > now;
  const mood = state.moodUntil > now;
  return (
    <section className="chat card" aria-label="Team requests">
      <div className="chat-head">
        <button className="chat-head-open" onClick={onOpen}>
          <span className="chat-channel">{CHANNEL}</span>
          {unread > 0 && <span className="badge badge-red">{unread} new</span>}
          {ready > 0 && <span className="badge badge-green">{ready} ready</span>}
          <span className="chat-open" aria-hidden>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 L15 12 L9 18" /></svg>
          </span>
        </button>
        {surveyOpen && (
          <button className="event-pill" onClick={onSurvey}>
            Survey · ends {formatCountdown(state.surveyEndsAt - now)}
          </button>
        )}
        {!surveyOpen && mood && <span className="event-pill event-pill-mood">Mood up · +25%</span>}
      </div>
      {state.orders.map((order) => (
        <PreviewRow key={order.id} state={state} order={order} dispatch={dispatch} onOpen={onOpen} />
      ))}
    </section>
  );
}

function RequestCard({ state, message, dispatch }: { state: GameState; message: ChatMessage; dispatch: Dispatch<Action> }) {
  const order = state.orders.find((o) => o.id === message.orderId);
  const items = message.items ?? [];
  const status = order ? orderStatus(state, order) : null;
  return (
    <div className={`request${status?.fillable ? ' request-ready' : ''}${order ? '' : ' request-done'}`}>
      <div className="request-items">
        {items.map((it, i) => (
          <span key={i} className="request-item">
            <ItemIcons items={[it]} have={[!!status?.have[i]]} size={30} />
            <span>{getTier(it.chain, it.tier).name}</span>
          </span>
        ))}
      </div>
      <div className="request-foot">
        {!order ? (
          <span className="request-status">Delivered</span>
        ) : status!.fillable ? (
          <button className="btn btn-primary btn-deliver" onClick={deliver(dispatch, order.id)}>
            Deliver · +{formatMoney(payout(state, order, state.updatedAt))}
          </button>
        ) : (
          <span className="request-status">
            {status!.have.filter(Boolean).length} of {items.length} on your desk · +{formatMoney(payout(state, order, state.updatedAt))}
          </span>
        )}
      </div>
    </div>
  );
}

/** The whole channel: every request, your deliveries and their replies. */
export function ChatSheet({ state, dispatch, onClose }: { state: GameState; dispatch: Dispatch<Action>; onClose: () => void }) {
  const listRef = useRef<HTMLDivElement>(null);
  // Where 'New' starts is fixed when the sheet opens, even though reading updates chatReadAt.
  const [readAt] = useState(state.chatReadAt);
  const firstUnread = state.chat.find((m) => m.from !== 'you' && m.at > readAt)?.id;
  const members = cast(state).map((id) => getCharacter(id)!).filter(Boolean);

  useEffect(() => {
    dispatch({ type: 'readChat', now: Date.now() });
    return () => dispatch({ type: 'readChat', now: Date.now() });
  }, [dispatch]);

  // Stay pinned to the latest message.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.chat.length]);

  return (
    <div className="sheet" role="dialog" aria-label="Team requests channel">
      <header className="sheet-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back to desk">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6 L9 12 L15 18" /></svg>
        </button>
        <div className="sheet-title">
          <span className="chat-channel">{CHANNEL}</span>
          <span className="sheet-sub">{members.length + 1} members · {getStage(state.stage).space.toLowerCase()}</span>
        </div>
        <span className="sheet-members" aria-hidden>
          {members.slice(0, 4).map((c) => (
            <img key={c.id} src={avatarArt(c.id)} alt="" width={24} height={24} />
          ))}
        </span>
      </header>
      <div className="sheet-list" ref={listRef}>
        {state.chat.map((m) => {
          const divider = m.id === firstUnread && <div className="divider-new">New</div>;
          if (m.from === 'system') {
            return (
              <div key={m.id} className="divider-chapter">
                {m.text}
              </div>
            );
          }
          if (m.from === 'you') {
            return (
              <div key={m.id}>
                {divider}
                <div className="bubble-you">
                  <span>{m.text}</span>
                  {m.items && <ItemIcons items={m.items} have={[]} size={24} />}
                </div>
              </div>
            );
          }
          const person = who(m.from);
          return (
            <div key={m.id}>
              {divider}
              <div className="sheet-msg">
                <img className="avatar avatar-lg" src={avatarArt(m.from)} alt="" width={36} height={36} draggable={false} />
                <div className="sheet-msg-body">
                  <span className="msg-meta">
                    <b>{person?.name ?? m.from}</b> <span className="msg-team">{person?.team} · {formatAgo(state.updatedAt - m.at)}</span>
                  </span>
                  <span className="sheet-text">{m.text}</span>
                  {m.orderId !== undefined && <RequestCard state={state} message={m} dispatch={dispatch} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
