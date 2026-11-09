# Short script format (`shorts/channel/episodes/NNN-slug.json`)

```jsonc
{
  "case": "001",                         // shown top-left: "CASE 001 · STILL UNSOLVED"
  "title": "The Wow! Signal",
  "music": "mystery",                    // mystery | tense | comedy | warm | action
  "voice": { ... },                      // optional override of channel.json voice
  "beats": [ { "line": "Spoken narration (≤ 18 words)", "visual": { "type": "...", ... }, "pause": 0.2, "sfx": "thud", "sfxAt": 0.3 } ],
  "cover":  { "lines": ["72 seconds", "from space", "then gone"], "highlight": 1, "icon": "wave", "stamp": "UNSOLVED" },
  "upload": { "title": "...#shorts", "description": "...", "hashtags": [...], "tags": [...], "pinned": "A) ... or B) ...? 👇" },
  "sources": ["https://..."]
}
```
Each beat lasts as long as its narration. Captions and sound design are added automatically.

## Visuals (`"type"`)
| type | fields | use for |
|---|---|---|
| `title` | `case`, `title` (`\n` for line break), `sub`, `stamp` | Opening case file + stamp |
| `date` | `date` ("AUG 15 1977"), `place` | When/where |
| `signal` | `spikeAt`, `label`, `idle`, `freq` | Signals, sounds, detections |
| `stat` | `value` (numbers count up), `unit`, `note` | Any striking number |
| `document` | `code`, `circle`, `circleAt`, `note` | Printouts, records, evidence |
| `word` | `text`, `size`, `color` | One-word punch ("Wow!", "Gone.") |
| `radar` | `years`, `label`, `result` | Searching with no result |
| `diagram` | `title`, `nodes: [{icon, label}]` | Explaining a theory step by step |
| `icon` | `icon`, `label`, `scale` | Generic scene |
| `versus` | `a`, `b` | The A/B question |
| `cta` | `text`, `next`, `stamp` | Ending + next case teaser |
| `scene` | `label`, `lit` (window indexes), `lightning` | Setting the scene (mansion at night, rain) |
| `suspect` | `letter` (A/B/C), `name`, `look`, `alibi` | One suspect + their alibi |
| `clue` | `n`, `icon`, `iconOpts`, `label` | The evidence (magnifier sweep) |
| `lineup` | `title`, `suspects: [{name, look}]`, `question` | "Who's lying?" |

Icons: `boots`, `clock`, `cup`, `key`, `dish`, `burst`, `cloud`, `earth`, `ship`, `book`, `question`, `wave`. Suspect looks: gardener, niece, butler, chef, glasses, plain. Add more in `shorts/visuals.js` (`ICONS`).
SFX (optional per beat): buzz, ding, knock, thud, whoosh, steps, heartbeat, static, power-down, door, gasp, sting.
