from prompts.tutor import build_tutor_instructions, language_name
from schemas.tutor import LanguageLevel, TutorParams


def test_default_params_use_dutch_and_english():
    prompt = build_tutor_instructions()

    assert "Dutch" in prompt
    assert "English" in prompt
    assert "beginner" in prompt


def test_custom_languages():
    params = TutorParams(target_language="fr", explanation_language="en")
    prompt = build_tutor_instructions(params)

    assert "French" in prompt
    assert "English" in prompt
    assert "Dutch" not in prompt


def test_japanese_language_name():
    assert language_name("ja") == "Japanese"


def test_unknown_language_code_falls_back_to_uppercase():
    assert language_name("ko") == "KO"


def test_scenario_is_included_when_set():
    params = TutorParams(scenario="ordering coffee")
    prompt = build_tutor_instructions(params)

    assert "ordering coffee" in prompt
    assert "Scenario:" in prompt


def test_scenario_omitted_when_not_set():
    prompt = build_tutor_instructions(TutorParams(scenario=None))

    assert "Scenario:" not in prompt


def test_beginner_scenario_keeps_conversation_default():
    params = TutorParams(level=LanguageLevel.beginner, scenario="ordering coffee")
    prompt = build_tutor_instructions(params)

    assert "unless they ask for a structured lesson" in prompt.lower()


def test_level_guidance_varies_by_level():
    beginner = build_tutor_instructions(TutorParams(level=LanguageLevel.beginner))
    advanced = build_tutor_instructions(TutorParams(level=LanguageLevel.advanced))

    assert "unless they ask you to teach" in beginner.lower()
    assert "native-like speech" in advanced.lower()


def test_beginner_uses_english_heavy_language_mix():
    prompt = build_tutor_instructions(TutorParams(level=LanguageLevel.beginner))

    assert "mostly English" in prompt
    assert "Do not run full conversations in Dutch" in prompt


def test_beginner_opens_in_english():
    prompt = build_tutor_instructions(TutorParams(level=LanguageLevel.beginner))

    assert "first turn in English only" in prompt


def test_stream_mode_voice_delivery():
    prompt = build_tutor_instructions()

    assert "one language per sentence" in prompt.lower()


def test_intermediate_conducts_dialogue_in_target_language():
    prompt = build_tutor_instructions(TutorParams(level=LanguageLevel.intermediate))

    assert "conduct most dialogue in Dutch" in prompt


def test_prompt_prioritizes_communication_over_perfection():
    prompt = build_tutor_instructions()

    assert "Never comment on accent" in prompt
    assert "If understood" in prompt
    assert "Prefer recasting" in prompt


def test_beginner_corrects_rarely():
    prompt = build_tutor_instructions(TutorParams(level=LanguageLevel.beginner))

    assert "correct rarely" in prompt.lower()


def test_conversation_first_not_unsolicited_teaching():
    native = build_tutor_instructions(native_practice_audio=True)
    stream = build_tutor_instructions()

    assert "Do not teach unsolicited" in native
    assert "Teach only when" in native
    assert "Conversation first" in stream
    assert "explicitly asks" in native.lower()


def test_native_practice_audio_routes_through_tools():
    prompt = build_tutor_instructions(native_practice_audio=True)

    assert "speak_practice_phrase" in prompt
    assert "explain_in_english" in prompt
    assert "set_conversation_mode" in prompt
    assert "Never speak Dutch on the Realtime stream" in prompt
    assert "ONLY that tool call" in prompt
    assert "Do not translate" in prompt


def test_native_practice_defaults_to_dutch_conversation():
    prompt = build_tutor_instructions(
        TutorParams(level=LanguageLevel.intermediate),
        native_practice_audio=True,
    )

    assert "live Dutch conversation" in prompt
    assert "explain_in_english" in prompt


def test_native_practice_beginner_opens_in_dutch_via_tool():
    prompt = build_tutor_instructions(
        TutorParams(level=LanguageLevel.beginner),
        native_practice_audio=True,
    )

    assert "greet in Dutch with speak_practice_phrase" in prompt
    assert "first turn in English only" not in prompt


def test_prompt_mentions_tools_not_fixed_script():
    prompt = build_tutor_instructions()

    assert "tools" in prompt.lower()
    assert "fixed lesson script" in prompt.lower()
