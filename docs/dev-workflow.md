# Development workflow

This repo is a **monorepo**: `frontend/` (Next.js), `backend/` (FastAPI), plus root docs like `PROJECT_CONTEXT.md`. Keep it as one repo — do not split into separate repositories.

## Parallel frontend + backend work

When working on frontend and backend at the same time, use **separate branches** (or **git worktrees**) so changes stay scoped and reviewable.

### Option A — Feature branches (one folder)

Switch branches when changing focus. Always branch from latest `main`:

```bash
git fetch origin
git checkout main && git pull origin main
git checkout -b feat/your-feature-name
```

- One feature per branch; one focused PR per branch.
- Never commit feature work directly on `main`.
- Frontend UI: `feat/ui-*` (e.g. `feat/ui-mvp`)
- Backend API: `feat/openai-realtime-pr*` or `feat/backend-*`

### Option B — Git worktrees (two folders, recommended for parallel dev)

Use worktrees when you want **backend running in one folder and frontend in another** without constantly switching branches:

```bash
# From your main clone (e.g. AiLanguageTutor)
git fetch origin
git worktree add ../AiLanguageTutor-frontend feat/your-frontend-branch
git worktree add ../AiLanguageTutor-backend feat/your-backend-branch
```

Example:

```bash
git worktree add ../AiLanguageTutor-frontend feat/ui-mvp
git worktree add ../AiLanguageTutor-backend feat/openai-realtime-pr3-session-endpoint
```

Then run each stack in its own folder — both tied to the same remote and git history:

| Folder | Branch | Dev server |
|--------|--------|------------|
| `../AiLanguageTutor-backend` | backend feature branch | `uvicorn main:app --reload --port 8000` |
| `../AiLanguageTutor-frontend` | frontend feature branch | `npm run dev` (port 3000) |

List worktrees: `git worktree list`  
Remove when done: `git worktree remove ../AiLanguageTutor-frontend`

## Before opening a PR

1. Confirm the branch contains only the intended scope (frontend **or** backend, not both unless intentional).
2. Rebase or merge latest `main` if it has moved.
3. Run relevant tests/build (`pytest` for backend, `npm run build` for frontend).

## Running locally (single checkout)

**Backend:**

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
pytest tests/ -v
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Secrets live in `backend/.env` (gitignored). Never commit API keys.
