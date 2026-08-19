export type TabId = 'schedule' | 'winddown' | 'alarm' | 'reminders' | 'trends';

const TABS: { id: TabId; label: string }[] = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'winddown', label: 'Wind-Down' },
  { id: 'alarm', label: 'Alarm' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'trends', label: 'Trends' },
];

export function NavTabs({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="nav-tabs">
      {TABS.map((t) => (
        <button key={t.id} className={active === t.id ? 'nav-tab-active' : ''} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
