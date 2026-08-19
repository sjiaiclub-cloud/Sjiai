import { useWindDownStage } from '../lib/useWindDownStage';

/** Global warm-hue overlay simulating a gradual blue-light shift as bedtime approaches. */
export function ScreenTintOverlay() {
  const { tintOpacity } = useWindDownStage();
  if (tintOpacity <= 0) return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        background: 'linear-gradient(180deg, rgba(255,150,60,0.55), rgba(255,90,30,0.75))',
        opacity: tintOpacity,
        mixBlendMode: 'soft-light',
        transition: 'opacity 2s linear',
      }}
    />
  );
}
