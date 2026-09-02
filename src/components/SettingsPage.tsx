import { useRef, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { defaultState, isPlausibleAppState, mergeWithDefaults } from '../lib/defaultState';
import { buildShareSummary } from '../lib/shareSummary';
import { saveFile } from '../lib/download';

export function SettingsPage() {
  const { state, setState } = useAppState();

  return (
    <div>
      <div className="card">
        <h2>Settings</h2>
        <p className="muted">Everything here is yours to change — nothing in this tab is visible to anyone else unless you explicitly share it.</p>

        <label className="field checkbox">
          <input
            type="checkbox"
            checked={state.preferences.lowPressureMode}
            onChange={(e) =>
              setState((prev) => ({ ...prev, preferences: { ...prev.preferences, lowPressureMode: e.target.checked } }))
            }
          />
          <span>Low-pressure mode</span>
        </label>
        <p className="muted small">
          Hides streak counts and numeric stats in favor of plain language. Tracking sleep can itself become
          a source of anxiety for some people (sometimes called orthosomnia) — if the numbers ever start
          feeling like a score to chase rather than a pattern to notice, turn this on.
        </p>
      </div>

      <ShareCard />
      <DataCard />

      <div className="card">
        <h2>What this prototype can't do (yet)</h2>
        <p className="muted small">
          This is a web app, which puts a real ceiling on a few things no amount of extra code here can lift:
          it can't lock other apps on your phone (that needs a native app with OS-level screen-time
          permissions), it can't guarantee the alarm or sleep sounds fire with this tab closed or the phone
          locked, and there's no account or server — everything lives only in this browser. Export your data
          below if you want a backup that survives a cleared cache.
        </p>
      </div>
    </div>
  );
}

function ShareCard() {
  const { state } = useAppState();
  const [copied, setCopied] = useState(false);
  const summary = buildShareSummary(state);

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard permission denied or unavailable — the textarea below still lets them select & copy manually
    }
  }

  return (
    <div className="card">
      <h2>Share my week</h2>
      <p className="muted small">
        A plain-text summary you can send to whoever you want — a parent, a coach, no one. This only leaves
        the app if you copy and send it yourself; nothing here is ever shared automatically.
      </p>
      <textarea className="share-textarea" readOnly value={summary} rows={6} />
      <button type="button" className="primary-btn" onClick={copy}>
        {copied ? 'Copied!' : 'Copy to clipboard'}
      </button>
    </div>
  );
}

function DataCard() {
  const { state, setState } = useAppState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  async function exportData() {
    setExportStatus(null);
    const filename = `driftly-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const result = await saveFile(filename, JSON.stringify(state, null, 2), 'application/json');
    if (!result.ok && result.reason !== 'declined') {
      setExportStatus(result.reason ?? "Couldn't save the file.");
    }
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!isPlausibleAppState(parsed)) {
          setImportError("That file doesn't look like a Driftly backup.");
          return;
        }
        if (!window.confirm('This replaces everything currently saved in this browser. Continue?')) return;
        setState(() => mergeWithDefaults(parsed));
      } catch {
        setImportError("Couldn't read that file — make sure it's a Driftly export.");
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    if (!window.confirm('This clears your schedule, settings, and all logs on this device. This cannot be undone. Continue?')) return;
    setState(() => defaultState());
  }

  return (
    <div className="card">
      <h2>Backup & data</h2>
      <p className="muted small">
        Everything is stored only in this browser — clearing your cache or switching devices loses it. Export
        a backup now and then to be safe.
      </p>
      <div className="dashboard-quick-actions">
        <button type="button" onClick={exportData}>
          ⬇️ Export my data
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          ⬆️ Import a backup
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={onFileChosen} />
      </div>
      {importError && <p className="muted small" style={{ color: 'var(--coral)' }}>{importError}</p>}
      {exportStatus && <p className="muted small" style={{ color: 'var(--coral)' }}>{exportStatus}</p>}
      <button type="button" className="danger-link" onClick={resetAll}>
        Reset everything on this device
      </button>
    </div>
  );
}
