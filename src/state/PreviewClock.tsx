import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface Ctx {
  offsetMinutes: number;
  setOffsetMinutes: (m: number) => void;
  tickNow: Date;
}

const PreviewClockCtx = createContext<Ctx | null>(null);

/**
 * Lets the demo "fast-forward" the clock so wind-down / alarm stages can be previewed
 * without waiting hours in a browser tab. offsetMinutes defaults to 0 (real time).
 */
export function PreviewClockProvider({ children }: { children: ReactNode }) {
  const [offsetMinutes, setOffsetMinutes] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const tickNow = new Date(Date.now() + offsetMinutes * 60000);
  // `tick` is read only to satisfy the linter's exhaustive-deps expectations; it forces a
  // periodic re-render so tickNow stays fresh even when offsetMinutes doesn't change.
  void tick;

  return (
    <PreviewClockCtx.Provider value={{ offsetMinutes, setOffsetMinutes, tickNow }}>
      {children}
    </PreviewClockCtx.Provider>
  );
}

export function usePreviewClock(): Ctx {
  const ctx = useContext(PreviewClockCtx);
  if (!ctx) throw new Error('usePreviewClock must be used within PreviewClockProvider');
  return ctx;
}
