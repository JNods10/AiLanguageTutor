import httpx

from config import settings

OPENAI_CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets"


def build_session_config(instructions: str) -> dict[str, object]:
    return {
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


async def create_realtime_client_secret(instructions: str) -> dict[str, object]:
    payload = {"session": build_session_config(instructions)}

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
