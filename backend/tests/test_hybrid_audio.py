from services.openai_realtime import build_session_config
from services.realtime_tools import (
    EXPLAIN_IN_ENGLISH,
    SET_CONVERSATION_MODE,
    SPEAK_PRACTICE_PHRASE,
    REALTIME_TUTOR_TOOLS,
)


def test_build_session_config_includes_tutor_tools_when_native_tts_enabled():
    config = build_session_config("Hi", native_practice_tts=True)

    assert config["tool_choice"] == "auto"
    tools = config["tools"]
    assert isinstance(tools, list)
    names = [tool["name"] for tool in tools]
    assert names == [
        SPEAK_PRACTICE_PHRASE,
        EXPLAIN_IN_ENGLISH,
        SET_CONVERSATION_MODE,
    ]
    assert len(tools) == len(REALTIME_TUTOR_TOOLS)


def test_build_session_config_omits_tools_by_default():
    config = build_session_config("Hi")

    assert "tools" not in config
