# OpenAI Realtime Migration Plan

Migrate from ElevenAgents (`@elevenlabs/react`) to OpenAI Realtime API (`gpt-realtime-2.1-mini`) for fluid Dutch/English voice tutoring with better cost control.

## Architecture

```
Browser                         FastAPI backend                 OpenAI
  │                                      │                            │
  │  POST /api/realtime/session          │                            │
  │  { targetLanguage, level, ... }      │  POST /v1/realtime/        │
  │ ───────────────────────────────────► │       client_secrets       │
  │                                      │ ─────────────────────────► │
  │  { clientSecret, ... }               │  ephemeral key + config    │
  │ ◄─────────────────────────────────── │ ◄───────────────────────── │
  │                                      │                            │
  │  WebRTC SDP handshake ───────────────────────────────────────────► │
  │  (mic in, tutor audio out, data channel for events)                │
```

The backend never streams audio. It holds the API key, builds tutor session config, and mints short-lived client secrets.

## Backend implementation steps

### Step 1 — Backend foundation (PR 1)

- Add `httpx`, `pydantic-settings`
- Structure: `config.py`, `routers/`, `services/`, `prompts/`, `schemas/`
- Health + config status endpoints
- CORS from env

### Step 2 — Language-agnostic tutor prompt (PR 2)

- `prompts/tutor.py` with `build_tutor_instructions(target_language, explanation_language, level, scenario)`
- Dutch as default, not hardcoded in routes
- Unit tests for prompt builder

### Step 3 — Session config builder (PR 3)

- `services/openai_realtime.py` builds OpenAI session payload
- Model: `gpt-realtime-2.1-mini`, voice: `marin`
- Semantic VAD + input transcription enabled

### Step 4 — Ephemeral session endpoint (PR 3)

- `POST /api/realtime/session`
- Validates request, builds prompt + config, calls `/v1/realtime/client_secrets`
- Maps OpenAI errors to clean HTTP responses

### Step 5 — Security and ops hardening (PR 4)

- Rate limiting, `OpenAI-Safety-Identifier`, expanded CORS
- README and error mapping polish

### Step 6 — Session metadata (future)

- Progress tracking, transcript persistence
- Skip for MVP

## PR breakdown

| PR | Scope | Status |
|----|-------|--------|
| **PR 1** | Backend scaffolding and config | Complete |
| **PR 2** | Tutor prompt builder (language-agnostic) | Pending |
| **PR 3** | Realtime session minting endpoint | Pending |
| **PR 4** | Backend hardening and docs | Pending |
| **PR 5** | Frontend: replace ElevenLabs with OpenAI WebRTC | Pending |
| **PR 6** | Frontend: transcripts and tutor UX | Pending |

## PR 1 — Backend scaffolding and config

**Files:**
- `backend/config.py`
- `backend/routers/health.py`
- `backend/main.py` (refactor)
- `backend/requirements.txt`
- `backend/.env.example`

**Acceptance criteria:**
- `uvicorn main:app --reload` works
- `GET /api/health` returns 200
- `GET /api/config/status` reports OpenAI configuration state

## PR 2 — Tutor prompt builder

**Files:**
- `backend/prompts/tutor.py`
- `backend/schemas/tutor.py`
- `backend/tests/test_tutor_prompt.py`

## PR 3 — Realtime session endpoint

**Files:**
- `backend/schemas/realtime.py`
- `backend/services/openai_realtime.py`
- `backend/routers/realtime.py`

**Test:**
```bash
curl -X POST http://localhost:8000/api/realtime/session \
  -H "Content-Type: application/json" \
  -d '{"targetLanguage":"nl","explanationLanguage":"en","level":"beginner"}'
```

## PR 5 — Frontend WebRTC flow

1. Call `POST /api/realtime/session`
2. Get ephemeral token
3. Create `RTCPeerConnection`, add mic track
4. POST SDP to `https://api.openai.com/v1/realtime/calls`
5. Play remote audio, listen on data channel for events

## Decisions

| Decision | Choice |
|----------|--------|
| Model default | `gpt-realtime-2.1-mini` |
| Voice default | `marin` |
| Session params | Accept `targetLanguage` / `level` from frontend from day one |
| Connection flow | Ephemeral token (browser connects directly to OpenAI) |

## Backend MVP definition

After PR 3, this should work:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

curl http://localhost:8000/api/health
curl http://localhost:8000/api/config/status
curl -X POST http://localhost:8000/api/realtime/session \
  -H "Content-Type: application/json" \
  -d '{"targetLanguage":"nl","explanationLanguage":"en","level":"beginner"}'
```
