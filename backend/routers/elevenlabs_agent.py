import httpx
from fastapi import APIRouter, HTTPException

from config import settings
from schemas.elevenlabs_agent import (
    AgentSessionOverrides,
    CreateAgentConversationRequest,
    CreateAgentConversationResponse,
)
from services.elevenlabs_agent_session import (
    build_agent_session_overrides,
    build_dynamic_variables,
)
from services.elevenlabs_conversation import create_conversation_token
from services.elevenlabs_errors import elevenlabs_error_detail

router = APIRouter()


@router.post("/api/elevenlabs/conversation", response_model=CreateAgentConversationResponse)
async def create_agent_conversation(
    request: CreateAgentConversationRequest,
) -> CreateAgentConversationResponse:
    if not settings.elevenlabs_agent_configured:
        raise HTTPException(
            status_code=503,
            detail=(
                "ElevenLabs Agent is not configured. Set ELEVENLABS_API_KEY and "
                "ELEVENLABS_AGENT_ID in backend/.env."
            ),
        )

    agent_id = settings.elevenlabs_agent_id.strip()
    overrides = build_agent_session_overrides(request.target_language)
    dynamic_variables = build_dynamic_variables(request.level)

    try:
        token = await create_conversation_token(agent_id)
    except httpx.HTTPStatusError as exc:
        raise _map_elevenlabs_error(exc) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not reach ElevenLabs.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return CreateAgentConversationResponse(
        conversation_token=token,
        agent_id=agent_id,
        overrides=AgentSessionOverrides(agent=overrides["agent"]),
        dynamic_variables=dynamic_variables,
    )


def _map_elevenlabs_error(exc: httpx.HTTPStatusError) -> HTTPException:
    status_code = exc.response.status_code
    detail = elevenlabs_error_detail(exc)

    if status_code in {401, 403}:
        return HTTPException(status_code=502, detail=detail)
    if status_code == 429:
        return HTTPException(status_code=429, detail="ElevenLabs rate limit exceeded.")
    if status_code >= 500:
        return HTTPException(status_code=502, detail="ElevenLabs service unavailable.")

    return HTTPException(status_code=502, detail=detail)
