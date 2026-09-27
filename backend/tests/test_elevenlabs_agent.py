from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient
from pydantic import SecretStr

from main import app
from services.elevenlabs_agent_session import build_dynamic_variables
from schemas.cefr import CefrLevel


@patch(
    "routers.elevenlabs_agent.create_conversation_token",
    new_callable=AsyncMock,
)
@patch("routers.elevenlabs_agent.settings.elevenlabs_agent_id", "agent_test123")
@patch("routers.elevenlabs_agent.settings.elevenlabs_api_key", SecretStr("test-key"))
def test_create_agent_conversation_returns_token_and_dynamic_variables(mock_token):
    mock_token.return_value = "conv-token-abc"

    client = TestClient(app)
    response = client.post(
        "/api/elevenlabs/conversation",
        json={
            "targetLanguage": "nl",
            "explanationLanguage": "en",
            "level": "B1",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["conversationToken"] == "conv-token-abc"
    assert body["agentId"] == "agent_test123"
    assert body["dynamicVariables"] == {"level": "B1"}
    assert body["overrides"]["agent"]["language"] == "nl"
    assert "prompt" not in body["overrides"]["agent"]
    mock_token.assert_awaited_once_with("agent_test123")


@patch("routers.elevenlabs_agent.settings.elevenlabs_agent_id", "")
def test_create_agent_conversation_requires_agent_config():
    client = TestClient(app)
    response = client.post(
        "/api/elevenlabs/conversation",
        json={"targetLanguage": "nl", "level": "A1"},
    )

    assert response.status_code == 503
    assert "ELEVENLABS_AGENT_ID" in response.json()["detail"]


@patch(
    "routers.elevenlabs_agent.create_conversation_token",
    new_callable=AsyncMock,
)
@patch("routers.elevenlabs_agent.settings.elevenlabs_agent_id", "agent_test123")
@patch("routers.elevenlabs_agent.settings.elevenlabs_api_key", SecretStr("test-key"))
def test_create_agent_conversation_maps_auth_error(mock_token):
    request = httpx.Request(
        "GET",
        "https://api.elevenlabs.io/v1/convai/conversation/token",
    )
    response = httpx.Response(401, request=request)
    mock_token.side_effect = httpx.HTTPStatusError(
        "Unauthorized",
        request=request,
        response=response,
    )

    client = TestClient(app)
    result = client.post(
        "/api/elevenlabs/conversation",
        json={"targetLanguage": "nl", "level": "A1"},
    )

    assert result.status_code == 502
    assert "ElevenLabs" in result.json()["detail"]


def test_build_dynamic_variables_uses_cefr_code():
    assert build_dynamic_variables(CefrLevel.c1) == {"level": "C1"}
