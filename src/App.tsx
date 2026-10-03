import { useState } from 'react';
import { Board } from './ui/Board';
import { BottomNav, SelectedBar, Toast, type Tab } from './ui/Bottom';
import { Notices, SurveySheet } from './ui/Notices';
import { OfficeView, SharesView, TeamView } from './ui/Screens';
import { ChatSheet, TeamChat } from './ui/TeamChat';
import { Header, StatPills } from './ui/Top';
import { useGame } from './ui/useGame';

export default function App() {
  const [state, dispatch] = useGame();
  const [tab, setTab] = useState<Tab>('desk');
  const [chatOpen, setChatOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);

  return (
    <main className="screen">
      <Header state={state} />
      <StatPills state={state} onShares={() => setTab('shares')} />
      {tab === 'desk' && (
        <>
          <TeamChat state={state} dispatch={dispatch} onOpen={() => setChatOpen(true)} onSurvey={() => setSurveyOpen(true)} />
          <Board state={state} dispatch={dispatch} />
          <SelectedBar state={state} dispatch={dispatch} />
        </>
      )}
      {tab === 'office' && <OfficeView state={state} dispatch={dispatch} />}
      {tab === 'team' && <TeamView state={state} />}
      {tab === 'shares' && <SharesView state={state} dispatch={dispatch} />}
      <BottomNav tab={tab} onTab={setTab} />
      {chatOpen && <ChatSheet state={state} dispatch={dispatch} onClose={() => setChatOpen(false)} />}
      {surveyOpen && state.surveyEndsAt > state.updatedAt && (
        <SurveySheet state={state} dispatch={dispatch} onClose={() => setSurveyOpen(false)} />
      )}
      <Notices state={state} dispatch={dispatch} />
      <Toast event={state.event} extra={null} now={state.updatedAt} />
    </main>
  );
}
