import httpx

from config import settings
from services.realtime_tools import SPEAK_PRACTICE_PHRASE_TOOL

OPENAI_CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets"


def build_session_config(
    instructions: str,
    *,
    native_practice_tts: bool = False,
) -> dict[str, object]:
    config: dict[str, object] = {
        "type": "realtime",
        "model": settings.openai_realtime_model,
        "instructions": instructions,
        "output_modalities": ["audio"],
        "audio": {
            "input": {
                "turn_detection": {"type": "semantic_vad"},
                "transcription": {"model": "gpt-live-transcribe"},
            },
            "output": {
                "voice": settings.openai_realtime_voice,
            },
        },
    }

    if native_practice_tts:
        config["tools"] = [SPEAK_PRACTICE_PHRASE_TOOL]
        config["tool_choice"] = "auto"

    return config


async def create_realtime_client_secret(
    instructions: str,
    *,
    native_practice_tts: bool = False,
) -> dict[str, object]:
    payload = {
        "session": build_session_config(
            instructions,
            native_practice_tts=native_practice_tts,
        )
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            OPENAI_CLIENT_SECRETS_URL,
            headers={
                "Authorization": f"Bearer {settings.openai_api_key.get_secret_value()}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        return response.json()
