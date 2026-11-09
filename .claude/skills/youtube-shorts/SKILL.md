---
name: youtube-shorts
description: Run the "Who Did It?" YouTube Shorts channel, 30-second fictional murder mysteries viewers solve in the comments. Writes the case (3 suspects, 1 fair clue), voices it, builds the motion-graphics Short, writes the title/description/hashtags and pinned answer, makes the cover, and keeps the 7-day plan. Use for "make today's short", "next case", "make case 00X", "plan next week", or any request to create or plan a video for the channel.
---


# YouTube Shorts: "Who Did It?" murder mysteries

Everything lives in `ai-video-editor/shorts/`:
- `channel/channel.json`: channel name, niche, narrator voice, default hashtags, and **rules you must follow**.
- `channel/plan.md`: the 7-day content plan, with a status per episode.
- `channel/episodes/NNN-slug.json`: one script per Short (format: `shorts/SCHEMA.md`).
- `render-short.js`: the renderer. Outputs go to `out/`.

## 0. Setup (fresh machine every session)
From `ai-video-editor/`: `npm install && npm run check`. Install espeak-ng if missing (`apt-get install -y espeak-ng`).
Voices: ElevenLabs if `ELEVENLABS_API_KEY` is set and reachable, otherwise **Kokoro** (natural offline voices, installed by `npm install`; the model is assembled and checksum-verified on first use), otherwise robotic espeak. The render prints `Voice: <engine>`, so tell the user which one was used. The narrator is `voice.kokoro` in `channel.json` (options: am_michael, am_fenrir, bm_george, af_heart, bf_emma, and more).

## Make one case (≈30–40s, 8 beats)
1. **Pick** the next ⬜ case in `plan.md`, or invent a new one following the rules in `channel.json` (fictional, no gore, fair clue).
2. **Write** `episodes/NNN-slug.json`, copying the structure of `001-rainy-night.json`:
   `title` (victim found + "one of them is lying") → `scene` (setting, including any fact the clue depends on) → `suspect` ×3 (A/B/C, each with an alibi) → `clue` (the one detail that breaks one alibi) → `lineup` ("Who's lying?") → `cta` ("answer in the pinned comment").
   Put the solution in `answer` and in `upload.pinned` (after blank lines so it isn't an instant spoiler). **Never say the answer in the video.**
   Sanity-check that a viewer can solve it from the video alone, with only one possible answer.
3. **Render stills:** `node shorts/render-short.js shorts/channel/episodes/NNN-slug.json --stills auto`, then tile them (`ffmpeg -i out/still-%d.png -vf "scale=270:-1,tile=8x1" -frames:v 1 out/contact.png`) and look. Fix anything clipped, then render without `--stills` and check the audio isn't silent (`ffmpeg -i out/NNN-slug.mp4 -af volumedetect -f null -`).
4. **Outputs:** `out/NNN-slug.mp4`, `out/NNN-slug-cover.png` (from `cover`), `out/NNN-slug-upload.txt` (title, description, hashtags, tags, pinned answer).
5. Mark it ✅ in `plan.md`. When fewer than 3 ⬜ remain, add new cases, each with a clear clue → answer.

Silhouette looks for suspects: gardener, niece, butler, chef, glasses, plain. Clue icons: boots (`iconOpts: {muddy: true}` for muddy ones), clock (`iconOpts: {time: "11:15"}`), cup, key, book, question. Add new ones in `shorts/visuals.js`.

## Deliver
Send the user the MP4 and cover, and paste the upload text. Remind them to:
- Set the cover in the YouTube app (Short → Edit → Thumbnail).
- Pin the comment.
- Turn on YouTube's **"Altered or synthetic content"** disclosure, because the AI narrator voice sounds realistic.

Commit the episode JSON and plan (not `out/` or `.cache/`), then push.

## Batch mode
"Make the whole week": repeat the steps for each ⬜ case, then send all the videos together with a posting schedule.
