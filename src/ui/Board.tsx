import { useLayoutEffect, useRef, useState, type Dispatch, type PointerEvent } from 'react';
import { canMerge } from '../game/board';
import type { Action } from '../game/state';
import type { GameState, Piece } from '../game/types';
import { pieceArt, pieceName } from './art';

const GAP = 4;
const PAD = 8;
const DRAG_THRESHOLD = 6;

interface Drag {
  from: number;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
  over: number | null;
}

function useCellSize(cols: number, rows: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const byW = (width - PAD * 2 - GAP * (cols - 1)) / cols;
      const byH = (height - PAD * 2 - GAP * (rows - 1)) / rows;
      setSize(Math.max(18, Math.floor(Math.min(byW, byH, 64))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols, rows]);
  return [ref, size] as const;
}

function cellIndexAt(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-index]');
  return el ? Number(el.dataset.index) : null;
}

export function Board({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  const { cols, rows, cells } = state.board;
  const [wrapRef, size] = useCellSize(cols, rows);
  // The ref is the source of truth so fast flicks (down/move/up before a re-render) still register;
  // the state copy only drives rendering.
  const dragRef = useRef<Drag | null>(null);
  const [drag, setDragState] = useState<Drag | null>(null);
  const setDrag = (d: Drag | null) => {
    dragRef.current = d;
    setDragState(d);
  };
  const wanted = new Set(state.orders.map((o) => `${o.chain}-${o.tier}`));
  const event = state.event;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) return;
    const index = cellIndexAt(e.clientX, e.clientY);
    if (index === null) return;
    if (!cells[index]) {
      dispatch({ type: 'deselect' });
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ from: index, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY, active: false, over: null });
  };

  const movedFar = (d: Drag, e: PointerEvent) => Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > DRAG_THRESHOLD;

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    setDrag({ ...d, x: e.clientX, y: e.clientY, active: d.active || movedFar(d, e), over: cellIndexAt(e.clientX, e.clientY) });
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const now = Date.now();
    if (!d.active && !movedFar(d, e)) {
      dispatch({ type: 'tap', index: d.from, now });
    } else {
      const to = cellIndexAt(e.clientX, e.clientY);
      if (to !== null && to !== d.from) dispatch({ type: 'drop', from: d.from, to, now });
    }
    setDrag(null);
  };

  const dragging = drag?.active ? cells[drag.from] : null;
  const mergeTarget = drag?.active && drag.over !== null && canMerge(cells[drag.from], cells[drag.over]) ? drag.over : null;
  const art = Math.round(size * 0.86);

  return (
    <div className="board-wrap" ref={wrapRef}>
      <div
        className="board"
        style={{ gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: GAP, padding: PAD }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
        onLostPointerCapture={() => setDrag(null)}
      >
        {cells.map((piece, i) => {
          const isGen = piece?.kind === 'generator';
          const lifted = drag?.active && drag.from === i;
          const fresh = event && (event.type === 'spawn' || event.type === 'merge') && event.index === i;
          const denied = event?.type === 'denied' && event.index === i;
          const isWanted = piece?.kind === 'item' && wanted.has(`${piece.chain}-${piece.tier}`);
          const classes = [
            'cell',
            isGen && 'cell-gen',
            state.selected === i && 'cell-selected',
            mergeTarget === i && 'cell-merge',
            drag?.active && drag.over === i && mergeTarget !== i && drag.from !== i && 'cell-over',
          ];
          return (
            <div key={i} data-index={i} className={classes.filter(Boolean).join(' ')} style={{ width: size, height: size }}>
              {isGen && <span className="gen-badge" aria-hidden />}
              {isWanted && <span className="wanted-dot" aria-hidden />}
              {piece && (
                <PieceImg
                  // Re-mount on spawn/merge/denied so the animation replays.
                  key={fresh || denied ? `${i}-${event!.at}` : i}
                  piece={piece}
                  size={art}
                  className={[
                    'piece',
                    lifted && 'piece-lifted',
                    fresh && (event!.type === 'merge' ? 'anim-merge' : 'anim-spawn'),
                    denied && 'anim-shake',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>
      {dragging && drag && (
        <PieceImg
          piece={dragging}
          size={Math.round(art * 1.2)}
          className="piece ghost"
          style={{ left: drag.x, top: drag.y }}
        />
      )}
    </div>
  );
}

function PieceImg({ piece, size, className, style }: { piece: Piece; size: number; className: string; style?: React.CSSProperties }) {
  return (
    <img
      src={pieceArt(piece)}
      alt={pieceName(piece)}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={style}
    />
  );
}
