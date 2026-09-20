from services import openai_realtime
from services.openai_realtime import build_turn_detection


def test_default_turn_detection_uses_server_vad_with_longer_silence():
    td = build_turn_detection()

    assert td["type"] == "server_vad"
    assert td["silence_duration_ms"] == 1700
    assert td["create_response"] is True


def test_semantic_vad_when_configured(monkeypatch):
    monkeypatch.setattr(
        openai_realtime.settings,
        "openai_realtime_turn_detection",
        "semantic_vad",
    )
    monkeypatch.setattr(
        openai_realtime.settings,
        "openai_realtime_vad_eagerness",
        "low",
    )

    td = build_turn_detection()
    assert td == {
        "type": "semantic_vad",
        "eagerness": "low",
        "create_response": True,
    }
