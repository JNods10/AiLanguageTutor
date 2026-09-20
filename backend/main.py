from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import health, realtime, translate, tts

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(realtime.router)
app.include_router(tts.router)
app.include_router(translate.router)
