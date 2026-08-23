import { useAppState } from '../state/AppStateContext';
import { MOTIVATION_TAGS } from '../types';
import { todayKey } from '../lib/time';

const MOTIVATION_MESSAGE: Record<string, string> = {
  mood: 'Consistent wind-down nights tend to track with steadier moods the next day.',
  focus: 'Easy wind-down nights are usually the ones where school the next day feels less foggy.',
  sports: 'Recovery and reaction time both lean on the sleep you bank tonight, not just game day.',
  skin: "Skin repair happens mostly during deep sleep — it's a slower payoff, but a real one.",
  energy: 'Fewer bypasses during wind-down usually means less of an afternoon energy crash.',
};

export function Trends() {
  const { state } = useAppState();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return state.logs[todayKey(d)];
  }).filter(Boolean);

  const loggedDays = last7.length;
  const easyNights = last7.filter((l) => l?.windDownFeltHard === false).length;
  const hardNights = last7.filter((l) => l?.windDownFeltHard === true).length;
  const totalBypasses = last7.reduce((sum, l) => sum + (l?.bypassCount ?? 0), 0);

  return (
    <div className="card">
      <h2>This week</h2>
      <p className="muted">
        A quick trend view, not a grade — sleep is a pattern to notice, not a score to chase.
      </p>

      <div className="stat-row">
        <Stat label="Days logged" value={`${loggedDays}/7`} />
        <Stat label="Easy nights" value={String(easyNights)} tone="mint" />
        <Stat label="Hard nights" value={String(hardNights)} tone={hardNights > 0 ? 'coral' : undefined} />
        <Stat label="App bypasses" value={String(totalBypasses)} tone={totalBypasses > 0 ? 'coral' : undefined} />
      </div>

      {state.profile.motivations.length > 0 ? (
        <div className="field">
          <span>Why this matters to you</span>
          {state.profile.motivations.map((id) => {
            const tag = MOTIVATION_TAGS.find((m) => m.id === id);
            if (!tag) return null;
            return (
              <p key={id} className="muted small">
                <strong>{tag.label}:</strong> {MOTIVATION_MESSAGE[id]}
              </p>
            );
          })}
        </div>
      ) : (
        <p className="muted small">
          Pick a reason sleep matters to you in setup, and trends here will speak to that directly.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'mint' | 'coral' }) {
  return (
    <div className="stat-tile">
      <div className={`stat-value ${tone ? `stat-value-${tone}` : ''}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
