# Driftly — Teen Sleep Schedule App

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

## Tabs

**Home** — the landing dashboard: tonight's plan at a glance, the current
wind-down stage, a streak/easy-nights snapshot, one-tap logging for
caffeine/sunlight, and a card pointing newcomers at the interactive demo.
Exists so the app reads as a real product with a hub, not five disconnected
settings screens.

**Demo** — a self-contained sandbox that walks through daytime → nudge →
wind-down → bedtime → wake, autoplaying or steppable, with a real clickable
app-lock/friction interaction and a tappable alarm tone. Doesn't touch real
settings or logs, so newcomers can feel out the mechanics before configuring
anything.

**Schedule** — plans off 90-minute sleep cycles rather than a flat number of
hours, so the recommended bedtime lines up with a natural wake point instead
of a mid-cycle wake-up. School nights and weekends are separate schedules
(teens' schedules are genuinely inconsistent, not a rounding error to smooth
over). If a school start time makes the stated wake time unrealistic, the
app says so and explains why — it doesn't silently force an earlier wake
time or block the input.

**Wind-Down** — a warm-hue overlay ramps in as bedtime approaches (global,
visible from any tab, simulating a phone-wide blue-light shift). Locked apps
are *the teen's own choice*, and "locked" always means friction, never a
wall: opening one mid-wind-down triggers a short countdown (gentle: 10s,
firm: 30s + a reason picked from a dropdown), then lets you through anyway.
Every bypass is logged, not punished — it shows up later in Trends as a
signal that the lock list might not fit, not as a strike. A separate,
optional "sleep sounds" player (rain / ocean waves / white noise) loops
continuously to help with falling asleep — the opposite job of the alarm
tones below, so it's kept as its own control.

**Alarm** — replaces a jarring blast with a soft, rising tone, with real
choices instead of one fixed sound: four tones (Chime, Piano, Marimba,
Birdsong, each previewable), how fast it ramps to full volume (30s / 90s /
3min), which days it's active (every day / school days / weekends, checked
against the real day of the week), and snooze length (5/10/15 min). The
"wake window" estimates the nearest 90-minute cycle boundary before your
target wake time using the same schedule math as the bedtime planner — the
UI is explicit that this is a math estimate, not motion or microphone-based
sleep-stage detection, since that's a real sensing and privacy tradeoff.

**Reminders** — contextual, not static. Logging caffeine after the cutoff
(schedule-derived: ~8h before bedtime) surfaces a warning tied to *that*
bedtime; no sunlight logged by late morning nudges you to get some; a hard
wind-down the night before paired with late caffeine surfaces as a named
correlation, not a generic "sleep better" tip.

**Trends** — a weekly view: days logged, current streak, easy vs. hard
nights, app bypasses, and a 7-day bar chart (taller + mint = easy night,
short + coral = hard night, grey = no log), tied back to whatever reason you
picked in onboarding for why sleep matters to you (mood, focus, sports,
skin, energy). Addresses the "why should I care" gap — a motivation tag
picked once shows up as the frame for the data, instead of the data floating
with no stakes attached.

## Known limitations of the web prototype

- App locking is simulated on a list of representative app names — a real
  version needs a native OS integration (Screen Time / Digital Wellbeing–style
  APIs) to actually gate other apps.
- The alarm and ambient sleep sounds only play while the tab is open; a
  shipped app needs native background scheduling and audio.
- The wake-window estimate is pure schedule math — no wearable or phone
  sensor integration, by design, to avoid the privacy tradeoff of always-on
  motion/mic sensing.
- All audio (alarm tones and sleep sounds) is synthesized in-browser with
  the Web Audio API — no sample/audio files are bundled.

## Running it

```bash
npm install
npm run dev      # dev server
npm run build     # typecheck + production build
npm run lint      # oxlint
```
