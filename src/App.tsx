import { useState } from 'react';
import { Board } from './ui/Board';
import { BottomNav, SelectedBar, Toast } from './ui/Bottom';
import { ChatSheet, TeamChat } from './ui/TeamChat';
import { Header, StatPills } from './ui/Top';
import { useGame } from './ui/useGame';

export default function App() {
  const [state, dispatch] = useGame();
  const [note, setNote] = useState<{ text: string; at: number } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <main className="screen">
      <Header state={state} />
      <StatPills state={state} />
      <TeamChat state={state} dispatch={dispatch} onOpen={() => setChatOpen(true)} />
      <Board state={state} dispatch={dispatch} />
      <SelectedBar state={state} dispatch={dispatch} />
      <BottomNav onSoon={(text) => setNote({ text, at: Date.now() })} />
      {chatOpen && <ChatSheet state={state} dispatch={dispatch} onClose={() => setChatOpen(false)} />}
      <Toast event={state.event} extra={note} now={Math.max(state.updatedAt, note?.at ?? 0)} />
    </main>
  );
}
