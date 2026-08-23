import { useState } from 'react';
import { AppStateProvider, useAppState } from './state/AppStateContext';
import { PreviewClockProvider } from './state/PreviewClock';
import { Onboarding } from './components/Onboarding';
import { NavTabs, type TabId } from './components/NavTabs';
import { InteractiveDemo } from './components/InteractiveDemo';
import { SchedulePlanner } from './components/SchedulePlanner';
import { WindDownPage } from './components/WindDownPage';
import { SmartAlarm } from './components/SmartAlarm';
import { Reminders } from './components/Reminders';
import { Trends } from './components/Trends';
import { ScreenTintOverlay } from './components/ScreenTintOverlay';
import './App.css';

function Shell() {
  const { state, setState } = useAppState();
  const [tab, setTab] = useState<TabId>('demo');

  if (!state.profile.onboarded) {
    return (
      <div className="app-shell">
        <Onboarding />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Sjiai</h1>
        <button
          type="button"
          className="link-btn"
          onClick={() => setState((p) => ({ ...p, profile: { ...p.profile, onboarded: false } }))}
        >
          Edit setup
        </button>
      </header>
      <NavTabs active={tab} onChange={setTab} />
      <main className="app-main">
        {tab === 'demo' && <InteractiveDemo />}
        {tab === 'schedule' && <SchedulePlanner />}
        {tab === 'winddown' && <WindDownPage onOpenDemo={() => setTab('demo')} />}
        {tab === 'alarm' && <SmartAlarm />}
        {tab === 'reminders' && <Reminders />}
        {tab === 'trends' && <Trends />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppStateProvider>
      <PreviewClockProvider>
        <ScreenTintOverlay />
        <Shell />
      </PreviewClockProvider>
    </AppStateProvider>
  );
}

export default App;
