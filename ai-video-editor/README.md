# AI Video Editor

Makes short animated videos: Node + canvas draws the frames (animate), ElevenLabs reads the script (voice), and ffmpeg puts it all together (render).

## Setup
```
npm install
cp .env.example .env   # paste your ElevenLabs API key
npm run check          # check my setup
npm run smoke          # renders out/smoke-test.mp4
```
You also need ffmpeg installed on the system.
