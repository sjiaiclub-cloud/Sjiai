---
name: youtube-shorts
description: Run the "Still Unsolved" faceless mystery YouTube Shorts channel end to end. Researches topics, writes and fact-checks the script, voices it, builds a motion-graphics Short, writes the title/description/hashtags, makes the cover, and keeps the 7-day plan. Use for "make today's short", "next episode", "make case 00X", "plan next week", or any request to create or plan a video for the channel.
---

# YouTube Shorts: mystery channel

Everything lives in `ai-video-editor/shorts/`:
- `channel/channel.json`: channel name, niche, narrator voice, default hashtags, and **rules you must follow**.
- `channel/plan.md`: the 7-day content plan, with a status per episode.
- `channel/episodes/NNN-slug.json`: one script per Short (format: `shorts/SCHEMA.md`).
- `render-short.js`: the renderer. Outputs go to `out/`.

## 0. Setup (fresh machine every session)
From `ai-video-editor/`: `npm install && npm run check`. Install espeak-ng if missing (`apt-get install -y espeak-ng`).
Voices: ElevenLabs if `ELEVENLABS_API_KEY` is set and reachable, otherwise **Kokoro** (natural offline voices, installed by `npm install`; the model is assembled and checksum-verified on first use), otherwise robotic espeak. The render prints `Voice: <engine>`, so tell the user which one was used. The narrator is `voice.kokoro` in `channel.json` (options: am_michael, am_fenrir, bm_george, af_heart, bf_emma, and more).

## The 7 steps (one Short)
1. **Research.** Pick the next ⬜ case from `plan.md`, or find a new one. Use WebSearch to check what's trending in mystery Shorts and to **fact-check every claim** you plan to say. Prefer specific, lesser-known, well-documented cases over generic lists. If a vidIQ or YouTube connector is available, use it for keywords and search volume.
2. **Voice.** Uses the channel narrator in `channel.json`. Don't change it between episodes, since consistency builds recognition.
3. **Script.** Write `episodes/NNN-slug.json`:
   - Line 1 is the hook. It states the most shocking fact in 3 seconds. No "hey guys", no intro.
   - 10–14 beats, **45–58 seconds total**. Each beat is one short spoken line (≤ 18 words) plus one visual.
   - Escalate: setup → strange detail → bigger strange detail → theories → open question.
   - End with an A/B question (`versus`), then a `cta` beat that teases the next case.
   - Facts only. Present theories as theories, add `sources`, and follow every rule in `channel.json` (no gore, 13+).
4. **Build the video.** `node shorts/render-short.js shorts/channel/episodes/NNN-slug.json --stills auto`, then tile the stills (`ffmpeg -i out/still-%d.png -vf "scale=240:-1,tile=7x2" -frames:v 1 out/contact.png`) and look at them. Fix anything clipped or overlapping, then render again without `--stills`. Check the audio isn't silent: `ffmpeg -i out/NNN-slug.mp4 -af volumedetect -f null -`.
5. **Details.** The `upload` block in the script becomes `out/NNN-slug-upload.txt`, containing the title (under 100 characters, curiosity-driven, ending with #shorts), description, sources, hashtags, tags and pinned comment.
6. **Thumbnail.** The `cover` block becomes `out/NNN-slug-cover.png`, with 2–3 huge words, one highlighted in red.
7. **Plan.** Mark the episode ✅ in `plan.md`. When fewer than 3 ⬜ remain, research and add next week's cases.

## Deliver
Send the user the MP4 and cover, and paste the upload text. Remind them to:
- Set the cover in the YouTube app (Short → Edit → Thumbnail).
- Pin the comment.
- Turn on YouTube's **"Altered or synthetic content"** disclosure if the ElevenLabs voice sounds realistic.

Commit the episode JSON and plan (not `out/` or `.cache/`), then push.

## Batch mode
"Make the whole week": repeat steps 1–6 for each ⬜ case, fact-checking each one separately, then send all the videos together with a posting schedule.
