import httpx

from config import settings

CONVERSATION_TOKEN_URL = "https://api.elevenlabs.io/v1/convai/conversation/token"


async def create_conversation_token(agent_id: str) -> str:
    api_key = settings.elevenlabs_api_key.get_secret_value().strip()
    if not api_key:
        raise ValueError("ElevenLabs API key is not configured.")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            CONVERSATION_TOKEN_URL,
            params={"agent_id": agent_id},
            headers={"xi-api-key": api_key},
        )
        response.raise_for_status()
        data = response.json()

    token = data.get("token")
    if not isinstance(token, str) or not token:
        raise ValueError("ElevenLabs returned an invalid conversation token.")

    return token
