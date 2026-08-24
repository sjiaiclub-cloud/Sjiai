import { useAppState, updateTodayLog } from '../state/AppStateContext';
import { usePreviewClock } from '../state/PreviewClock';
import { useSchedule } from '../lib/useSchedule';
import { useWindDownStage } from '../lib/useWindDownStage';
import { summarizeWeek } from '../lib/weekStats';
import { MOTIVATION_MESSAGE } from '../lib/motivation';
import { MOTIVATION_TAGS } from '../types';
import { formatClock } from '../lib/time';
import type { TabId } from './NavTabs';

const STAGE_PILL: Record<string, string> = {
  normal: '🌤️ Nothing locked right now',
  nudge: '🔔 Wind-down starting soon',
  winddown: '🌇 Wind-down is active',
  locked: '🌙 Past bedtime',
};

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Winding down?';
}

export function Dashboard({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { state, setState, today } = useAppState();
  const { tickNow } = usePreviewClock();
  const schedule = useSchedule();
  const { stage } = useWindDownStage();
  const week = summarizeWeek(state);
  const primaryMotivation = state.profile.motivations[0];
  const motivationTag = MOTIVATION_TAGS.find((m) => m.id === primaryMotivation);

  return (
    <div>
      <div className="dashboard-greeting">
        <h2>{greeting(tickNow)}</h2>
        <span className="dashboard-date">
          {tickNow.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card dashboard-card-wide">
          <span className={`dashboard-stage-pill stage-${stage}`}>{STAGE_PILL[stage]}</span>
          <h3>Tonight's plan</h3>
          <div className="schedule-highlight" style={{ padding: '6px 0' }}>
            <div>
              <div className="big-time">{formatClock(schedule.windDownStart)}</div>
              <div className="muted small">wind-down</div>
            </div>
            <div className="arrow">→</div>
            <div>
              <div className="big-time">{formatClock(schedule.bedtime)}</div>
              <div className="muted small">lights out</div>
            </div>
            <div className="arrow">→</div>
            <div>
              <div className="big-time">{formatClock(schedule.wakeTime)}</div>
              <div className="muted small">wake up</div>
            </div>
          </div>
          <button type="button" className="dashboard-card-action" onClick={() => onNavigate('winddown')}>
            Open wind-down
          </button>
        </div>

        <div className="dashboard-card">
          <h3>This week</h3>
          <div className="stat-row" style={{ margin: 0 }}>
            <div className="stat-tile">
              <div className="stat-value stat-value-mint">{week.streak}d</div>
              <div className="stat-label">streak</div>
            </div>
            <div className="stat-tile">
              <div className="stat-value">{week.easyNights}</div>
              <div className="stat-label">easy nights</div>
            </div>
          </div>
          <button type="button" className="dashboard-card-action" onClick={() => onNavigate('trends')}>
            View trends
          </button>
        </div>

        <div className="dashboard-card">
          <h3>Quick log</h3>
          <p className="muted small">Feeds tonight's reminders — nothing here is graded.</p>
          <div className="dashboard-quick-actions">
            <button type="button" onClick={() => updateTodayLog(setState, { sunlightLogged: true })}>
              {today.sunlightLogged ? '☀️ Sunlight logged' : '☀️ Log sunlight'}
            </button>
            <button
              type="button"
              onClick={() => updateTodayLog(setState, { caffeineTime: tickNow.toTimeString().slice(0, 5) })}
            >
              ☕ Log caffeine now
            </button>
          </div>
          <button type="button" className="dashboard-card-action" onClick={() => onNavigate('reminders')}>
            Open reminders
          </button>
        </div>

        <div className="dashboard-card">
          <h3>New here?</h3>
          <p className="muted small">Watch a full day play out in an interactive sandbox — no setup needed.</p>
          <button type="button" className="dashboard-card-action" onClick={() => onNavigate('demo')}>
            ✨ Try the demo
          </button>
        </div>

        {motivationTag && (
          <div className="dashboard-card">
            <h3>Why you're doing this</h3>
            <p className="muted small">
              <strong>{motivationTag.label}:</strong> {MOTIVATION_MESSAGE[motivationTag.id]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
