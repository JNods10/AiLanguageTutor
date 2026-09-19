import httpx

from config import settings

ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"


async def synthesize_phrase(text: str) -> bytes:
    voice_id = settings.elevenlabs_voice_id.strip()
    api_key = settings.elevenlabs_api_key.get_secret_value().strip()

    if not api_key or not voice_id:
        raise ValueError("ElevenLabs is not configured.")

    url = ELEVENLABS_TTS_URL.format(voice_id=voice_id)
    payload = {
        "text": text.strip(),
        "model_id": settings.elevenlabs_tts_model,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json=payload,
        )
        response.raise_for_status()
        return response.content
