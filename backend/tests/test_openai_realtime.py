from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient
from pydantic import SecretStr

from config import settings
from main import app
from schemas.tutor import LanguageLevel, TutorParams
from services.openai_realtime import build_session_config, transcription_language


def test_build_session_config_includes_model_voice_and_vad():
    config = build_session_config("You are a tutor.")

    assert config["type"] == "realtime"
    assert config["model"] == settings.openai_realtime_model
    assert config["instructions"] == "You are a tutor."
    assert config["output_modalities"] == ["audio"]
    assert config["audio"]["input"]["turn_detection"] == {"type": "semantic_vad"}
    assert config["audio"]["output"]["voice"] == settings.openai_realtime_voice


def test_transcription_language_beginner_uses_explanation_language():
    params = TutorParams(
        target_language="nl",
        explanation_language="en",
        level=LanguageLevel.beginner,
    )
    assert transcription_language(params) == "en"


def test_transcription_language_intermediate_uses_target_language():
    params = TutorParams(
        target_language="nl",
        explanation_language="en",
        level=LanguageLevel.intermediate,
    )
    assert transcription_language(params) == "nl"


def test_build_session_config_sets_transcription_language():
    beginner = build_session_config(
        "Hi",
        TutorParams(level=LanguageLevel.beginner, explanation_language="en"),
    )
    assert beginner["audio"]["input"]["transcription"]["language"] == "en"

    intermediate = build_session_config(
        "Hi",
        TutorParams(
            target_language="nl",
            level=LanguageLevel.intermediate,
        ),
    )
    assert intermediate["audio"]["input"]["transcription"]["language"] == "nl"


@patch("routers.realtime.create_realtime_client_secret", new_callable=AsyncMock)
def test_create_session_returns_client_secret(mock_create_secret):
    mock_create_secret.return_value = {
        "value": "ek_test_secret",
        "expires_at": 1234567890,
        "session": {"type": "realtime"},
    }

    client = TestClient(app)
    response = client.post(
        "/api/realtime/session",
        json={
            "targetLanguage": "nl",
            "explanationLanguage": "en",
            "level": "beginner",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["clientSecret"] == "ek_test_secret"
    assert body["expiresAt"] == 1234567890
    assert body["session"]["type"] == "realtime"
    mock_create_secret.assert_awaited_once()


@patch("routers.realtime.settings.openai_api_key", SecretStr(""))
def test_create_session_requires_openai_config():
    client = TestClient(app)
    response = client.post("/api/realtime/session", json={})

    assert response.status_code == 503
    assert response.json()["detail"] == "OpenAI API key is not configured."


@patch("routers.realtime.create_realtime_client_secret", new_callable=AsyncMock)
def test_create_session_maps_openai_auth_error(mock_create_secret):
    request = httpx.Request("POST", "https://api.openai.com/v1/realtime/client_secrets")
    response = httpx.Response(401, request=request)
    mock_create_secret.side_effect = httpx.HTTPStatusError(
        "Unauthorized",
        request=request,
        response=response,
    )

    client = TestClient(app)
    result = client.post(
        "/api/realtime/session",
        json={"targetLanguage": "nl", "explanationLanguage": "en", "level": "beginner"},
    )

    assert result.status_code == 502
    assert result.json()["detail"] == "OpenAI authentication failed."


@patch("routers.realtime.create_realtime_client_secret", new_callable=AsyncMock)
def test_create_session_maps_openai_rate_limit(mock_create_secret):
    request = httpx.Request("POST", "https://api.openai.com/v1/realtime/client_secrets")
    response = httpx.Response(429, request=request)
    mock_create_secret.side_effect = httpx.HTTPStatusError(
        "Too Many Requests",
        request=request,
        response=response,
    )

    client = TestClient(app)
    result = client.post(
        "/api/realtime/session",
        json={"targetLanguage": "nl", "explanationLanguage": "en", "level": "beginner"},
    )

    assert result.status_code == 429
    assert result.json()["detail"] == "OpenAI rate limit exceeded."
