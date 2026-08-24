import { useAppState } from '../state/AppStateContext';
import { MOTIVATION_TAGS } from '../types';
import { MOTIVATION_MESSAGE } from '../lib/motivation';
import { summarizeWeek } from '../lib/weekStats';

export function Trends() {
  const { state } = useAppState();
  const week = summarizeWeek(state);

  return (
    <div className="card">
      <h2>This week</h2>
      <p className="muted">
        A quick trend view, not a grade — sleep is a pattern to notice, not a score to chase.
      </p>

      <div className="stat-row">
        <Stat label="Days logged" value={`${week.loggedDays}/7`} />
        <Stat label="Streak" value={`${week.streak}d`} tone={week.streak >= 3 ? 'mint' : undefined} />
        <Stat label="Easy nights" value={String(week.easyNights)} tone="mint" />
        <Stat label="Hard nights" value={String(week.hardNights)} tone={week.hardNights > 0 ? 'coral' : undefined} />
        <Stat label="App bypasses" value={String(week.totalBypasses)} tone={week.totalBypasses > 0 ? 'coral' : undefined} />
      </div>

      <div className="week-chart">
        {week.days.map((day) => {
          const height = day.log
            ? day.log.windDownFeltHard === true
              ? 30
              : day.log.windDownFeltHard === false
                ? 90
                : 55
            : 14;
          const color = !day.log
            ? 'var(--border)'
            : day.log.windDownFeltHard === true
              ? 'var(--coral)'
              : day.log.windDownFeltHard === false
                ? 'var(--mint)'
                : 'var(--accent)';
          return (
            <div key={day.date} className="week-chart-col">
              <div className="week-chart-bar" style={{ height: `${height}%`, background: color }} />
              <span className="week-chart-label">{day.label}</span>
            </div>
          );
        })}
      </div>
      <p className="muted small">Taller and mint = easy night. Short and coral = hard night. Grey = no log.</p>

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
