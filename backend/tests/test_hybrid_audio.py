from prompts.hybrid_audio import (
    SPEAK_PRACTICE_PHRASE,
    append_native_practice_tts_instructions,
)
from prompts.tutor import build_tutor_instructions
from services.openai_realtime import build_session_config


def test_append_native_practice_tts_forbids_target_language_on_stream():
    base = build_tutor_instructions(native_practice_audio=True)
    prompt = append_native_practice_tts_instructions(base, "Dutch", "English")

    assert "Do not speak Dutch on the Realtime audio output" in prompt
    assert "Never tell the student you cannot speak Dutch" in prompt
    assert SPEAK_PRACTICE_PHRASE in prompt


def test_build_session_config_includes_tool_when_native_tts_enabled():
    config = build_session_config("Hi", native_practice_tts=True)

    assert config["tool_choice"] == "auto"
    tools = config["tools"]
    assert isinstance(tools, list)
    assert tools[0]["name"] == SPEAK_PRACTICE_PHRASE


def test_build_session_config_omits_tools_by_default():
    config = build_session_config("Hi")

    assert "tools" not in config
