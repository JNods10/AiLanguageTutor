from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient
from pydantic import SecretStr

from config import settings
from main import app


@patch("routers.tts.synthesize_phrase", new_callable=AsyncMock)
def test_phrase_tts_returns_audio(mock_synthesize):
    mock_synthesize.return_value = b"fake-mp3-bytes"

    client = TestClient(app)
    response = client.post("/api/tts/phrase", json={"text": "Goedemorgen"})

    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
    assert response.content == b"fake-mp3-bytes"
    mock_synthesize.assert_awaited_once_with("Goedemorgen")


@patch("routers.tts.settings.elevenlabs_api_key", SecretStr(""))
def test_phrase_tts_requires_elevenlabs_config():
    client = TestClient(app)
    response = client.post("/api/tts/phrase", json={"text": "Hallo"})

    assert response.status_code == 503
    assert "not configured" in response.json()["detail"].lower()


@patch("routers.tts.synthesize_phrase", new_callable=AsyncMock)
def test_phrase_tts_maps_auth_error(mock_synthesize):
    request = httpx.Request("POST", "https://api.elevenlabs.io/v1/text-to-speech/x")
    response = httpx.Response(401, request=request)
    mock_synthesize.side_effect = httpx.HTTPStatusError(
        "Unauthorized",
        request=request,
        response=response,
    )

    client = TestClient(app)
    result = client.post("/api/tts/phrase", json={"text": "Hallo"})

    assert result.status_code == 502
    assert result.json()["detail"] == "ElevenLabs authentication failed."


def test_config_status_includes_elevenlabs():
    client = TestClient(app)
    response = client.get("/api/config/status")

    assert response.status_code == 200
    body = response.json()
    assert "elevenLabsConfigured" in body
    assert body["elevenLabsConfigured"] == settings.elevenlabs_configured
