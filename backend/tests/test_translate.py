from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient
from pydantic import SecretStr

from main import app


@patch("routers.translate.translate_text", new_callable=AsyncMock)
def test_translate_returns_translation(mock_translate):
    mock_translate.return_value = "Good morning"

    client = TestClient(app)
    response = client.post(
        "/api/translate",
        json={"text": "Goedemorgen", "source_language": "nl", "target_language": "en"},
    )

    assert response.status_code == 200
    assert response.json() == {"translation": "Good morning"}
    mock_translate.assert_awaited_once_with("Goedemorgen", "nl", "en")


@patch("routers.translate.settings.openai_api_key", SecretStr(""))
def test_translate_requires_openai_config():
    client = TestClient(app)
    response = client.post("/api/translate", json={"text": "Hallo"})

    assert response.status_code == 503
    assert "not configured" in response.json()["detail"].lower()


@patch("routers.translate.translate_text", new_callable=AsyncMock)
def test_translate_maps_rate_limit(mock_translate):
    request = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
    response = httpx.Response(429, request=request)
    mock_translate.side_effect = httpx.HTTPStatusError(
        "Too Many Requests",
        request=request,
        response=response,
    )

    client = TestClient(app)
    result = client.post("/api/translate", json={"text": "Dank je"})

    assert result.status_code == 429
