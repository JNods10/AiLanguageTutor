import httpx
from fastapi import APIRouter, HTTPException

from config import settings
from prompts.tutor import build_tutor_instructions
from schemas.realtime import CreateSessionRequest, CreateSessionResponse
from services.openai_realtime import create_realtime_client_secret

router = APIRouter()


@router.post("/api/realtime/session", response_model=CreateSessionResponse)
async def create_session(request: CreateSessionRequest) -> CreateSessionResponse:
    if not settings.openai_configured:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key is not configured.",
        )

    tutor_params = request.to_tutor_params()
    instructions = build_tutor_instructions(tutor_params)

    try:
        data = await create_realtime_client_secret(instructions, tutor_params)
    except httpx.HTTPStatusError as exc:
        raise _map_openai_error(exc) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not reach OpenAI.",
        ) from exc

    client_secret = data.get("value")
    if not isinstance(client_secret, str) or not client_secret:
        raise HTTPException(
            status_code=502,
            detail="OpenAI returned an invalid session response.",
        )

    session = data.get("session")
    if not isinstance(session, dict):
        session = {}

    expires_at = data.get("expires_at")
    if expires_at is not None and not isinstance(expires_at, int):
        expires_at = None

    return CreateSessionResponse(
        client_secret=client_secret,
        expires_at=expires_at,
        session=session,
    )


def _map_openai_error(exc: httpx.HTTPStatusError) -> HTTPException:
    status_code = exc.response.status_code

    if status_code in {401, 403}:
        return HTTPException(status_code=502, detail="OpenAI authentication failed.")
    if status_code == 429:
        return HTTPException(status_code=429, detail="OpenAI rate limit exceeded.")
    if status_code >= 500:
        return HTTPException(status_code=502, detail="OpenAI service unavailable.")

    return HTTPException(status_code=502, detail="OpenAI rejected the session request.")
