# Sjiai — Teen Sleep Schedule App

A self-directed sleep coach for teens: it plans a bedtime, eases you into it
without a hard shutdown, wakes you gently, and nudges you with reminders that
are based on what you actually logged instead of a generic checklist.

This is a client-only web prototype (React + TypeScript + Vite, state in
`localStorage`). It's meant to demonstrate the product mechanics end-to-end
in a browser; a shipped version would need a native app for real OS-level
screen tinting, app locking, and background alarms.

## Design stance: this is the teen's app, not a parent's remote

Every setting is owned and editable by the person using it — which apps get
"sticky," how firm the friction is, the schedule itself. There's no parent
dashboard or override. That choice follows directly from the product
feedback this was built against: a sleep app that feels imposed gets
uninstalled or routed around (second phone, browser instead of app,
disabling it outright). Ownership is the only way the lock features have a
chance of sticking.

## The four features, and how the feedback shaped each one

**Bedtime calculation** (`Schedule` tab) — plans off 90-minute sleep cycles
rather than a flat number of hours, so the recommended bedtime lines up with
a natural wake point instead of a mid-cycle wake-up. School nights and
weekends are separate schedules (teens' schedules are genuinely inconsistent,
not a rounding error to smooth over). If a school start time makes the
stated wake time unrealistic, the app says so and explains why — it doesn't
silently force an earlier wake time or block the input.

**Forced wind-down** (`Wind-Down` tab) — a warm-hue overlay ramps in as
bedtime approaches (global, visible from any tab, simulating a phone-wide
blue-light shift). Locked apps are *the teen's own choice* from onboarding,
and "locked" always means friction, never a wall: opening one mid-wind-down
triggers a short countdown (gentle: 10s, firm: 30s + a reason picked from a
dropdown), then lets you through anyway. Every bypass is logged, not
punished — it shows up later in Trends as a signal that the lock list might
not fit, not as a strike.

**Smart alarm** (`Alarm` tab) — a soft ascending three-note chime that fades
in over ~90 seconds (Web Audio API), instead of a jarring blast. The "wake
window" estimates the nearest 90-minute cycle boundary before your target
wake time using the same schedule math as the bedtime planner — the UI is
explicit that this is a math estimate from your plan, not motion or
microphone-based sleep-stage detection, since that's a real sensing and
privacy tradeoff the feedback flagged as complex.

**Reminders** (`Reminders` tab) — contextual, not static. Logging caffeine
after the cutoff (schedule-derived: ~8h before bedtime) surfaces a warning
tied to *that* bedtime; no sunlight logged by late morning nudges you to get
some; a hard wind-down the night before paired with late caffeine surfaces
as a named correlation, not a generic "sleep better" tip.

**Trends** (`Trends` tab) — a lightweight weekly view (days logged, easy vs.
hard nights, app bypasses) tied back to whatever reason you picked in
onboarding for why sleep matters to you (mood, focus, sports, skin, energy).
Addresses the "why should I care" gap from the feedback — a motivation tag
picked once shows up as the frame for the data, instead of the data floating
with no stakes attached.

## Demo-only affordance: the preview clock

Real wind-down/alarm timing plays out over hours, which is impractical to
sit through in a browser tab. The `Wind-Down` tab has a "preview clock"
slider that fast-forwards the app's notion of "now" so you can see the
nudge → wind-down → post-bedtime stages, and the alarm firing, without
waiting. It's clearly labeled as a demo control, not a feature a shipped
app would have.

## Known limitations of the web prototype

- App locking is simulated on a list of representative app names — a real
  version needs a native OS integration (Screen Time / Digital Wellbeing–style
  APIs) to actually gate other apps.
- The alarm only rings while the tab is open; a shipped app needs native
  background scheduling and notifications.
- The wake-window estimate is pure schedule math — no wearable or phone
  sensor integration, by design, to avoid the privacy tradeoff of always-on
  motion/mic sensing.

## Running it

```bash
npm install
npm run dev      # dev server
npm run build     # typecheck + production build
npm run lint      # oxlint
```
