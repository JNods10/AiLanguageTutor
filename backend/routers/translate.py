import httpx
from fastapi import APIRouter, HTTPException

from config import settings
from schemas.translate import TranslateRequest, TranslateResponse
from services.translate import translate_text

router = APIRouter()


@router.post("/api/translate", response_model=TranslateResponse)
async def translate(request: TranslateRequest) -> TranslateResponse:
    if not settings.openai_configured:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key is not configured.",
        )

    try:
        translation = await translate_text(
            request.text,
            request.source_language,
            request.target_language,
        )
    except httpx.HTTPStatusError as exc:
        raise _map_openai_error(exc) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not reach OpenAI.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return TranslateResponse(translation=translation)


def _map_openai_error(exc: httpx.HTTPStatusError) -> HTTPException:
    status_code = exc.response.status_code

    if status_code in {401, 403}:
        return HTTPException(status_code=502, detail="OpenAI authentication failed.")
    if status_code == 429:
        return HTTPException(status_code=429, detail="OpenAI rate limit exceeded.")
    if status_code >= 500:
        return HTTPException(status_code=502, detail="OpenAI service unavailable.")

    return HTTPException(status_code=502, detail="OpenAI rejected the translation request.")
