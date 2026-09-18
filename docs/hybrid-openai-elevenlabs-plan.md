# Hybrid voice plan: OpenAI conversation + ElevenLabs Dutch TTS

Goal: keep **OpenAI Realtime** for teaching and back-and-forth (mostly English), and use **ElevenLabs TTS API** only for **short Dutch phrases** so pronunciation is native-ish without paying for full ElevenAgents minutes (~$0.08/min).

## Roles

| Component | Responsibility |
|-----------|----------------|
| OpenAI Realtime | English explanations, questions, conversation flow, listening to the student |
| ElevenLabs TTS API | Audio for modeled Dutch phrases only (character-based billing, not agent minutes) |
| FastAPI backend | Session minting (existing), new TTS proxy (API key stays server-side) |
| Next.js frontend | WebRTC to OpenAI, play Dutch clips, handle client tools on data channel |

## Build phases (walk through in order)

### Phase 0 — ElevenLabs TTS spike (backend only)

- [ ] Add `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` (Dutch-friendly voice) to `backend/.env` (gitignored).
- [ ] Implement `POST /api/tts/phrase` with body `{ "text": "Goedemorgen" }`.
- [ ] Call ElevenLabs text-to-speech (e.g. Flash/Turbo multilingual); return `audio/mpeg`.
- [ ] Verify with curl: Dutch sounds acceptable; log character count per request for cost estimates.

**Done when:** You can play a good Dutch MP3 without touching Realtime.

### Phase 1 — Simple frontend button (MVP)

- [ ] Add a dev or voice UI control: text field + **“Hear in Dutch”** → calls `/api/tts/phrase` → plays audio.
- [ ] No Realtime tool wiring yet.

**Done when:** You trust the voice for common lesson phrases.

### Phase 2 — Prompt: OpenAI does not speak Dutch

- [ ] Update `backend/prompts/tutor.py`: tutor speaks **English on the OpenAI audio stream** (per level rules).
- [ ] For every modeled Dutch line, instruct the model to use the client tool (Phase 3) instead of speaking Dutch itself.

**Done when:** Instructions clearly forbid Dutch on the Realtime audio output.

### Phase 3 — Realtime client tool + data channel

- [ ] Register a session tool e.g. `speak_dutch_phrase({ phrase: string })` in `build_session_config`.
- [ ] Listen on WebRTC `dataChannel` (`oai-events`) in `frontend/lib/realtime/connect.ts` (or hook layer).
- [ ] On tool call: fetch TTS from backend, play on a **separate** `Audio` element, optionally duck OpenAI track.
- [ ] Send tool result back on the data channel so the tutor continues.

**Done when:** During a live session, Dutch lines play via ElevenLabs automatically.

### Phase 4 — Cost and polish

- [ ] Cache TTS by `(voice_id, text)` for repeated phrases.
- [ ] Log ElevenLabs characters per session.
- [ ] Level behavior: beginner = fewer tool calls; intermediate+ = more Dutch clips as needed.

## What we are not doing (for daily practice)

- Running the full 20–30 minute session on **ElevenAgents** (expensive agent-minute meter + LLM on top).
- Expecting OpenAI’s `marin` voice to sound like native Dutch (prompt cannot fix TTS).

## Reference: current codebase touchpoints

- Session + prompt: `backend/routers/realtime.py`, `backend/prompts/tutor.py`, `backend/services/openai_realtime.py`
- Voice UI: `frontend/components/chat/VoicePanel.tsx`, `frontend/lib/hooks/useRealtimeVoice.ts`
- WebRTC: `frontend/lib/realtime/connect.ts` (data channel exists; event handling not implemented yet)
- Practice level → session: sidebar `LevelContext` → `POST /api/realtime/session`

## Branching

Create a new feature branch from latest `main` for each phase (or one branch for Phase 0–1, then separate PRs for tool wiring).
