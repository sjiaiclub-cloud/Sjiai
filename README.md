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

**Settings** — low-pressure mode (swaps streak counts and numeric stats for
plain language, for anyone who finds tracking itself stressful), an opt-in
"Share my week" plain-text summary the teen generates and copies themselves
(the one deliberate opening for a parent/coach to stay in the loop — nothing
is ever pushed or pulled automatically), and full data export/import as JSON
since everything lives only in this browser's `localStorage`.

## Product decisions worth calling out

- **The Home dashboard's "morning check-in"** consolidates the three things
  worth logging (sunlight, last night's wind-down, whether sleep onset was on
  time) into one lightweight prompt shown once a day, instead of scattering
  logging across tabs — manual habit logging has notoriously low follow-through,
  and asking once at the moment the teen naturally opens the app beats hoping
  they remember to go find each toggle.
- **Repeated bypasses turn into a renegotiation prompt, not a silent tally.**
  Bypassing the same locked app 3 nights running surfaces "that's not a
  willpower problem, this lock doesn't fit — want to unlock it?" right in the
  friction modal, plus a follow-up card in Reminders with a one-tap unlock.
  A lock nobody ever revisits just becomes theater.
- **The alarm's wake-window estimate learns.** Rather than trusting the
  planned bedtime forever, it keeps a rolling average of the last few
  mornings' "did you fall asleep around when planned?" answers and shifts the
  cycle-boundary math accordingly — shown in the UI as "adjusted ~N min
  later than planned."
- **Autonomy vs. accountability isn't all-or-nothing.** Full parent lockout
  solves one failure mode (a sleep app that feels imposed gets uninstalled)
  but reopens another (zero accountability structure for younger teens whose
  parents may legitimately co-own the household's phone policy). The "Share
  my week" export is the middle ground: consent-based, teen-initiated,
  never a live dashboard someone else can check without the teen knowing.

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
- A web app manifest and a minimal service worker (`public/manifest.json`,
  `public/sw.js`) make the app installable ("Add to Home Screen") where the
  hosting environment allows it — this is the honest ceiling of what a PWA
  can do; it does not grant background execution once the OS suspends the
  tab, and registration is wrapped defensively since some embedded/sandboxed
  viewers block it outright.

## Running it

```bash
npm install
npm run dev      # dev server
npm run build     # typecheck + production build
npm run lint      # oxlint
```
