# AI Language Teacher — Agent Guide

Monorepo: `frontend/` (Next.js), `backend/` (FastAPI). See `PROJECT_CONTEXT.md` for product goals and `docs/openai-realtime-migration-plan.md` for the OpenAI Realtime migration plan.

## Git workflow

When starting a **new feature or PR**, always branch from the latest `main`:

```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

- Never commit feature work directly on `main`.
- One feature per branch; one focused PR per branch.
- Rebase or merge latest `main` before opening a PR if `main` has moved.

## Backend

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
pytest tests/ -v
```

Secrets live in `backend/.env` (gitignored). Never commit API keys.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

See `frontend/AGENTS.md` for Next.js-specific notes.
