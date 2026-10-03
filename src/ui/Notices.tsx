import { useState, type Dispatch, type ReactNode } from 'react';
import { economy } from '../config/economy';
import { surveyQuestions } from '../content/events';
import { getSpace } from '../content/office';
import { getStage, paths, uniStage, type PathId } from '../content/paths';
import { getChain } from '../content/chains';
import { paycheck, titlesFor } from '../game/career';
import type { Action } from '../game/state';
import type { GameState, Notice } from '../game/types';
import { generatorArt, iconArt } from './art';
import { formatMoney } from './format';

function Card({ kicker, title, children, action }: { kicker: string; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="modal-backdrop">
      <div className="modal card" role="dialog" aria-label={title}>
        <span className="modal-kicker">{kicker}</span>
        <h2 className="modal-title">{title}</h2>
        {children}
        {action}
      </div>
    </div>
  );
}

const Shares = ({ n, vesting = true }: { n: number; vesting?: boolean }) => (
  <span className="modal-reward">
    <img src={iconArt('shares')} alt="" width={22} height={22} />+{n} share{n === 1 ? '' : 's'}
    {vesting && <span className="modal-reward-sub"> · vest in 24h</span>}
  </span>
);

function PathChoice({ dispatch }: { dispatch: Dispatch<Action> }) {
  const [picked, setPicked] = useState<PathId | null>(null);
  return (
    <div className="modal-backdrop">
      <div className="modal modal-wide card" role="dialog" aria-label="Choose your path">
        <span className="modal-kicker">GRADUATION · AGE 22</span>
        <h2 className="modal-title">Choose your path</h2>
        <p className="modal-text">This decides your job, your pay, your generators and who messages you.</p>
        <div className="path-list">
          {paths.map((p) => {
            const first = p.stages['first-job'];
            return (
              <button key={p.id} className={`path-card${picked === p.id ? ' path-picked' : ''}`} onClick={() => setPicked(p.id)}>
                <span className="path-gens">
                  {[...first.chains, ...p.stages.junior.chains].map((c) => (
                    <img key={c} src={generatorArt(c)} alt={getChain(c).generator} width={34} height={34} />
                  ))}
                </span>
                <span className="path-body">
                  <span className="path-name">
                    {p.name} <span className="path-pay">starts {formatMoney(paycheck(first.titles[0]))}/paycheck</span>
                  </span>
                  <span className="path-pitch">{p.pitch}</span>
                  <span className="path-twist">
                    <b>{p.twist.name}:</b> {p.twist.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          className="btn btn-primary btn-big"
          disabled={!picked}
          onClick={() => picked && dispatch({ type: 'choosePath', path: picked, now: Date.now() })}
        >
          {picked ? `Start as ${titlesFor('first-job', picked)[0]}` : 'Pick a path'}
        </button>
      </div>
    </div>
  );
}

function NoticeCard({ notice, state, dispatch }: { notice: Notice; state: GameState; dispatch: Dispatch<Action> }) {
  const ok = (label: string) => (
    <button className="btn btn-primary btn-big" onClick={() => dispatch({ type: 'dismissNotice', now: Date.now() })}>
      {label}
    </button>
  );
  switch (notice.type) {
    case 'promotion':
      return (
        <Card kicker="PROMOTION" title={notice.to} action={ok('Nice')}>
          <p className="modal-text">You were {notice.from}. Now look at you.</p>
          <div className="pay-rise">
            <span className="pay-old">{formatMoney(notice.oldPay)}</span>
            <span aria-hidden>→</span>
            <span className="pay-new">{formatMoney(notice.newPay)}</span>
            <span className="pay-label">per paycheck</span>
          </div>
          <Shares n={notice.shares} />
        </Card>
      );
    case 'review': {
      const stage = getStage(notice.stage);
      const last = notice.stage === 'junior';
      return (
        <Card kicker={`PERFORMANCE REVIEW · ${stage.name.toUpperCase()}`} title={notice.rating} action={ok(last ? 'Thanks' : 'Next chapter')}>
          <p className="modal-text">{notice.line}</p>
          <p className="modal-stat">
            {notice.ordersFilled} requests filled · target {notice.target}
          </p>
          <Shares n={notice.shares} />
          {last && <p className="modal-text modal-muted">Chapter 4, the scale-up, arrives in a future update. Keep merging.</p>}
        </Card>
      );
    }
    case 'new-chapter': {
      const stage = getStage(notice.stage);
      const path = state.path ? paths.find((p) => p.id === state.path) : null;
      const chains = notice.stage === 'uni' ? uniStage.chains : path!.stages[notice.stage].chains;
      return (
        <Card kicker={`CHAPTER ${stage.chapter} · AGES ${stage.ages}`} title={stage.space} action={ok('Get to work')}>
          <p className="modal-text">
            New generator{chains.length > 1 ? 's' : ''} on your desk, a new team in the chat, and a new space to rebuild.
          </p>
          <div className="modal-gens">
            {chains.map((c) => (
              <span key={c} className="modal-gen">
                <img src={generatorArt(c)} alt="" width={52} height={52} />
                {getChain(c).generator}
              </span>
            ))}
          </div>
          {path && notice.stage === 'first-job' && (
            <p className="modal-text modal-muted">
              <b>{path.twist.name}:</b> {path.twist.description}
            </p>
          )}
        </Card>
      );
    }
    case 'space-done':
      return (
        <Card kicker="SPACE COMPLETE" title={getSpace(notice.spaceId).name} action={ok('Admire it')}>
          <p className="modal-text">{getSpace(notice.spaceId).doneLine}</p>
          <Shares n={notice.shares} vesting={false} />
        </Card>
      );
    case 'choose-path':
      return <PathChoice dispatch={dispatch} />;
  }
}

export function Notices({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  const notice = state.notices[0];
  if (!notice) return null;
  return <NoticeCard key={state.notices.length + notice.type} notice={notice} state={state} dispatch={dispatch} />;
}

/** The engagement survey: three questions, every answer accepted. */
export function SurveySheet({ state, dispatch, onClose }: { state: GameState; dispatch: Dispatch<Action>; onClose: () => void }) {
  // Pick 3 questions based on when this survey closes, so it's stable while open.
  const [questions] = useState(() => {
    const start = Math.floor(state.surveyEndsAt / 1000) % surveyQuestions.length;
    return [0, 1, 2].map((i) => surveyQuestions[(start + i * 3) % surveyQuestions.length]);
  });
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const done = answers.every((a) => a !== null);

  return (
    <div className="modal-backdrop">
      <div className="modal modal-wide card" role="dialog" aria-label="Engagement survey">
        <span className="modal-kicker">ENGAGEMENT SURVEY · 100% ANONYMOUS*</span>
        <h2 className="modal-title">How are we doing?</h2>
        {questions.map((q, qi) => (
          <div key={qi} className="survey-q">
            <span className="survey-question">{q.question}</span>
            <div className="survey-answers">
              {q.answers.map((a, ai) => (
                <button
                  key={ai}
                  className={`survey-answer${answers[qi] === ai ? ' survey-picked' : ''}`}
                  onClick={() => setAnswers(answers.map((v, i) => (i === qi ? ai : v)))}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="modal-text modal-muted">
          Office mood rises: requests pay {Math.round((economy.survey.moodPayMultiplier - 1) * 100)}% more for a day. *It is not anonymous.
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Later
          </button>
          <button
            className="btn btn-primary btn-big"
            disabled={!done}
            onClick={() => {
              dispatch({ type: 'answerSurvey', now: Date.now() });
              onClose();
            }}
          >
            Submit · +{economy.survey.rewardShares} shares
          </button>
        </div>
      </div>
    </div>
  );
}
