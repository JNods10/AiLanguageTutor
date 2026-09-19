import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from config import settings
from schemas.tts import PhraseTtsRequest
from services.elevenlabs_tts import synthesize_phrase

router = APIRouter()


@router.post("/api/tts/phrase")
async def phrase_tts(request: PhraseTtsRequest) -> Response:
    if not settings.elevenlabs_configured:
        raise HTTPException(
            status_code=503,
            detail="ElevenLabs API key or voice ID is not configured.",
        )

    try:
        audio = await synthesize_phrase(request.text)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        raise _map_elevenlabs_error(exc) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not reach ElevenLabs.",
        ) from exc

    if not audio:
        raise HTTPException(status_code=502, detail="ElevenLabs returned empty audio.")

    return Response(content=audio, media_type="audio/mpeg")


def _map_elevenlabs_error(exc: httpx.HTTPStatusError) -> HTTPException:
    status_code = exc.response.status_code

    if status_code in {401, 403}:
        return HTTPException(status_code=502, detail="ElevenLabs authentication failed.")
    if status_code == 402:
        return HTTPException(
            status_code=402,
            detail="ElevenLabs credits exhausted. Add credits or upgrade your plan.",
        )
    if status_code == 429:
        return HTTPException(status_code=429, detail="ElevenLabs rate limit exceeded.")
    if status_code >= 500:
        return HTTPException(status_code=502, detail="ElevenLabs service unavailable.")

    return HTTPException(status_code=502, detail="ElevenLabs rejected the TTS request.")
