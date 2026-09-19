from fastapi import APIRouter

from config import settings

router = APIRouter()


@router.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}


@router.get("/api/config/status")
def config_status() -> dict[str, str | bool]:
    return {
        "openaiConfigured": settings.openai_configured,
        "realtimeModel": settings.openai_realtime_model,
        "realtimeVoice": settings.openai_realtime_voice,
        "elevenLabsConfigured": settings.elevenlabs_configured,
        "elevenLabsVoiceId": settings.elevenlabs_voice_id or None,
    }
