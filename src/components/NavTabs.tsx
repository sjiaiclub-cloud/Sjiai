export type TabId = 'home' | 'demo' | 'schedule' | 'winddown' | 'alarm' | 'reminders' | 'trends' | 'settings';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'demo', label: 'Demo', icon: '✨' },
  { id: 'schedule', label: 'Schedule', icon: '🌙' },
  { id: 'winddown', label: 'Wind-Down', icon: '🌆' },
  { id: 'alarm', label: 'Alarm', icon: '⏰' },
  { id: 'reminders', label: 'Reminders', icon: '💡' },
  { id: 'trends', label: 'Trends', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function NavTabs({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="nav-tabs">
      {TABS.map((t) => (
        <button key={t.id} className={active === t.id ? 'nav-tab-active' : ''} onClick={() => onChange(t.id)}>
          <span aria-hidden>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
