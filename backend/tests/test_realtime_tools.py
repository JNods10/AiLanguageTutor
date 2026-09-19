from services.realtime_tools import (
    EXPLAIN_IN_ENGLISH_TOOL,
    SET_CONVERSATION_MODE_TOOL,
    SPEAK_PRACTICE_PHRASE_TOOL,
)


def test_speak_practice_phrase_one_utterance_contract():
    description = str(SPEAK_PRACTICE_PHRASE_TOOL["description"])
    assert "one call" in description.lower()
    assert "twice" in description.lower()
    assert "completes the spoken turn" in description.lower()
    assert "explain_in_english" in description.lower()


def test_explain_in_english_tool_has_topic_param():
    params = EXPLAIN_IN_ENGLISH_TOOL["parameters"]
    assert "topic" in params["properties"]
    assert "topic" in params["required"]


def test_set_conversation_mode_enum():
    mode_prop = SET_CONVERSATION_MODE_TOOL["parameters"]["properties"]["mode"]
    assert set(mode_prop["enum"]) == {
        "free_chat",
        "structured_lesson",
        "explain_focus",
    }
