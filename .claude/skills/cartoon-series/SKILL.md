---
name: cartoon-series
description: Turn a one-line idea into an animated cartoon series for Reels/TikTok. Writes the story, voices every character, draws every scene with code, adds music, and ends each part on an A/B vote. Use for "/cartoon-series <idea>", "make part 2", "the vote was A", or any request to make or continue a cartoon series episode.
---

# Cartoon series

You turn one line ("a kid locked in a mall overnight") into a vertical 1080×1920 cartoon episode that ends on a vote, and you continue the series from the vote result. Every frame is drawn in code by the engine in `ai-video-editor/series/`, so there are no AI-generated images.

## 0. Setup (every session, it's a fresh machine)
Run from `ai-video-editor/`:
```
npm install
npm run check
```
- **Voices:** ElevenLabs if `ELEVENLABS_API_KEY` is set and reachable, otherwise Kokoro natural offline voices (set `voice.kokoro` per character, e.g. af_heart, am_michael, bf_emma, bm_george), otherwise espeak-ng. If `espeak-ng` is missing, install it: `apt-get install -y espeak-ng`. Tell the user which voice engine was used, because espeak sounds robotic. Never use MBROLA (`mb-*`) voices for videos that will be posted: their licence is non-commercial only. ElevenLabs needs a paid plan for commercial (monetised) use.
- ffmpeg and Node 18+ are required.

## 1. New series vs. next part
- **New idea:** create `series/<slug>/bible.md` with the logline, 2–4 characters (look + personality + voice), world rules, a rough 5-part arc, and an empty vote log. Then write `part-1.json`.
- **Next part:** read `bible.md` and every previous `part-N.json`. Ask for the vote result if the user didn't give it. Log the result in the bible, then write `part-(N+1).json`, which must pay off the winning option in its first 5 seconds. Reuse the exact same `characters` block so the characters look and sound the same.

## 2. Write the episode (`series/<slug>/part-N.json`)
Format: read `ai-video-editor/series/SCHEMA.md` before writing. Story rules:
- **Hook in the first 2 seconds.** Open on the most intriguing beat (a strange text, a scream, a weird line). No intros, no "hi guys".
- **30–55 seconds**, 10–16 beats. Every line is 12 words or fewer, sounds like real speech, and can be read in one glance.
- One clear question drives the part. Escalate every 3–4 beats with a new reveal, a sound or a shot change.
- Mix shot types: close-ups for emotion, two-shots for conversation, phone or card beats for reveals. Use `react` beats (a silent face) after big moments.
- **End on a cliffhanger** and then the vote. Both options must be tempting and lead to different stories. Never use "good vs. bad".
- Keep everything original: no copyrighted characters, names, logos or song lyrics. Don't copy another creator's character designs or signature looks either. Before naming a new series, web-search the title to make sure it isn't an existing show, book or brand.
- Pick `music` per scene to fit the mood (mystery, tense, comedy, warm, action).

## 3. Render and check
From `ai-video-editor/`:
```
node series/render-episode.js series/<slug>/part-N.json --stills auto
```
Tile the stills (`ffmpeg -i out/still-%d.png -vf "scale=240:-1,tile=8x2" -frames:v 1 out/contact.png`) and look at them. Check that subtitles fit on screen, faces aren't hidden by the phone or a card, and the vote card is readable. Fix the script and re-run. Then render the full video:
```
node series/render-episode.js series/<slug>/part-N.json
```
Output: `out/<slug>-part-N.mp4` plus `out/<slug>-part-N-caption.txt`, a ready-to-paste post caption. Voice clips are cached in `series/<slug>/.cache/`, so re-renders are fast.

Before delivering, confirm the audio isn't silent with `ffmpeg -i <mp4> -af volumedetect -f null -` (the mean should be around -20 to -14 dB).

## 4. Deliver
Send the MP4 to the user. Include a short beat-by-beat summary and the caption text. Remind them to pin a comment asking "A or B?". Commit `bible.md` and the episode JSON (not `out/` or `.cache/`), then push.

## Extending the engine
- New background: add to `SETS` in `series/engine/sets.js`.
- New hair, outfit or accessory: `series/engine/characters.js`.
- New sound effect or music mood: `series/engine/score.js`.
After any engine change, re-render an existing episode's stills to make sure nothing broke.
