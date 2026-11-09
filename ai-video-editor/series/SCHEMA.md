# Episode script format

One JSON file per part: `series/<slug>/part-N.json`. Rendered by `node series/render-episode.js <file>`.

```jsonc
{
  "series": "Texts From Tomorrow",     // shown top-left on every frame
  "part": 1,
  "title": "Don't Go To School",       // optional, used in the post caption
  "music": "mystery",                  // default mood: mystery | tense | comedy | warm | action
  "voteMusic": "tense",                // optional mood for the vote screen
  "narrator": { "espeak": "mb-en1", "pitch": 38, "speed": 150, "gender": "male" },  // optional; reads "narrate" beats + the vote
  "characters": { "<id>": Character, ... },
  "scenes": [ Scene, ... ],
  "vote": { "question": "What should Maya do?", "a": "Run and find Jay", "b": "Text back", "narrate": true },
  "hashtags": ["animation", "series"]
}
```

## Character
```jsonc
{
  "name": "Maya",
  "skin": "#a86b48",                   // any hex
  "eyes": "#3b2618",
  "hair": { "style": "bun", "color": "#1f1612" },   // style: short | spiky | bun | long | curly | buzz | ponytail
  "outfit": { "style": "hoodie", "color": "#d8432f", "inner": "#f6f1e6", "accent": "#3fd1c4" },  // style: hoodie | jacket | tee
  "accessory": "headphones",           // headphones | glasses | cap | earring | (omit)
  "accent": "#ffd23f",                 // name-tag colour, headphone ring, cap colour
  "voice": {
    "gender": "female",                // used to pick an ElevenLabs voice automatically
    "eleven": "<voice_id>",            // optional: a specific ElevenLabs voice
    "espeak": "en-us+f3",              // offline voice: en-us+f1..f5 (F), en-us+m1..m7 (M). Don't use mb-* (MBROLA): non-commercial licence
    "pitch": 62, "speed": 165          // espeak only: pitch 0–99, words per minute
  }
}
```

## Scene
```jsonc
{ "set": "bedroom-night", "music": "tense", "cast": ["maya", "jay"], "beats": [ Beat, ... ] }
```
Sets: `bedroom-night`, `mall-night`, `school-hallway`, `street-night`, `kitchen-day`, `park-day`, `classroom`, `rooftop-sunset`, `forest-night`, `void` / `void:#hex` (a plain dramatic background).
`cast` is optional: it sets left/right order in two-shots. Otherwise the order characters first appear in is used.

## Beats (each needs exactly one of say / narrate / phone / card / react)
| Beat | Fields | Notes |
|---|---|---|
| Dialogue | `say`, `line`, `emotion`, `with`, `shot`, `look`, `listen` | `with` = the other character(s) in frame → two-shot. `shot`: close / two / wide. `listen`: `{ "jay": "surprised" }` sets listeners' faces. |
| Narration | `narrate: true`, `line` | Needs top-level `narrator`. Shows a wide shot with subtitles. |
| Phone | `phone` (contact name), `text` **or** `messages: [{from: "them"/"me", text}]`, `read` | Messages build up into one thread per contact for the whole episode. `read: "<id>"` voices incoming texts in that character's voice with an echo (`readFx`). |
| Card | `card` (big text), `sub` | Time jumps and location titles ("NEXT MORNING"). |
| Reaction | `react: "<id>"`, `emotion`, `with`, `dur` | A silent face, used after reveals. |

Shared optional fields: `dur` (seconds; dialogue defaults to voice length + 0.4), `sfx` + `sfxAt`, `shake: true`, `fx: "blackout"` (lights flicker out and stay dark for the rest of the scene).

Emotions: neutral, happy, scared, angry, sad, surprised, smug, confused.
SFX: buzz, ding, knock, thud, whoosh, steps, heartbeat, static, power-down, door, gasp, sting. (Phone beats add buzz/send sounds automatically; cards and scene changes add whooshes.)
