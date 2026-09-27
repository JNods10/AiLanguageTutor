# ElevenLabs Agents voice

Voice practice uses **ElevenLabs Agents** (WebRTC): one agent handles listening, reasoning, and speech—including the target language.

## Architecture

```
Browser (Voice tab)          FastAPI                    ElevenLabs
      │                         │                            │
      │ POST /api/elevenlabs/conversation                    │
      │ { targetLanguage, level, ... }                       │
      │ ───────────────────────►│ GET …/conversation/token   │
      │                         │ ──────────────────────────►│
      │ { conversationToken, overrides }                     │
      │ ◄───────────────────────│                            │
      │ startSession (WebRTC) ───────────────────────────────►│
```

- **Backend** holds `ELEVENLABS_API_KEY`, mints a conversation token, and returns `dynamicVariables` (e.g. `{ "level": "B1" }`) for your dashboard prompt `{{level}}`.
- **System prompt** lives in the ElevenLabs agent dashboard (not replaced by `tutor.py`).
- **Frontend** uses `@elevenlabs/react` (`ConversationProvider` + `startSession`).
- **OpenAI Realtime** and hybrid `speak_practice_phrase` are no longer used for the Voice tab (code may remain until removed).

## Backend env

```env
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=agent_...   # from ElevenLabs Agents dashboard
```

The API key must include **Conversational AI / Agents** access (ElevenLabs permission `convai_write`). Keys that only work for TTS (`/api/tts/phrase`) are not enough for voice agent sessions.

Optional (phrase TTS dev endpoint, not required for Agents voice):

```env
ELEVENLABS_VOICE_ID=...
```

## ElevenLabs dashboard

1. Create or pick an Agent with a Dutch-friendly voice.
2. Enable **authentication** on the agent (so the app must use conversation tokens from your backend).
3. Define a dynamic variable **`level`** in the agent and use `{{level}}` in the system prompt (CEFR: A1–C1). The app sends the sidebar selection on each session.

## Verify

```bash
curl http://localhost:8000/api/config/status
# elevenLabsAgentConfigured: true

curl -X POST http://localhost:8000/api/elevenlabs/conversation \
  -H "Content-Type: application/json" \
  -d '{"targetLanguage":"nl","explanationLanguage":"en","level":"B1"}'
```

Then open **Voice** → **Start talking**.
