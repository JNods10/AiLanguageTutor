# AI Language Teacher

Monorepo for the AI Language Teacher application — an interactive language-learning platform with voice conversations, corrections, and progress tracking.

## Structure

- `frontend/` — Next.js web app
- `backend/` — Python FastAPI API
- `PROJECT_CONTEXT.md` — product overview and goals

## Local development

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend expects the API at `http://localhost:8000` by default.
