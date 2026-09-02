import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppState, DayLog } from '../types';
import { loadState, saveState, defaultState, emptyDayLog } from '../lib/defaultState';
import { todayKey } from '../lib/time';

interface Ctx {
  state: AppState;
  setState: (updater: (prev: AppState) => AppState) => void;
  today: DayLog;
  yesterday: DayLog | undefined;
}

const AppStateCtx = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(() => loadState() ?? defaultState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setState = (updater: (prev: AppState) => AppState) => setStateRaw(updater);

  const key = todayKey();
  const today = state.logs[key] ?? emptyDayLog(key);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = state.logs[todayKey(yesterdayDate)];

  return (
    <AppStateCtx.Provider value={{ state, setState, today, yesterday }}>{children}</AppStateCtx.Provider>
  );
}

export function useAppState(): Ctx {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export function updateTodayLog(setState: Ctx['setState'], patch: Partial<DayLog>) {
  const key = todayKey();
  setState((prev) => {
    const existing = prev.logs[key] ?? emptyDayLog(key);
    return { ...prev, logs: { ...prev.logs, [key]: { ...existing, ...patch } } };
  });
}
