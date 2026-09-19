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
    assert "## Scenario" in prompt


def test_scenario_omitted_when_not_set():
    prompt = build_tutor_instructions(TutorParams(scenario=None))

    assert "## Scenario" not in prompt


def test_beginner_scenario_includes_structured_lesson_hint():
    params = TutorParams(level=LanguageLevel.beginner, scenario="ordering coffee")
    prompt = build_tutor_instructions(params)

    assert "structured mini-lesson" in prompt.lower()


def test_level_guidance_varies_by_level():
    beginner = build_tutor_instructions(TutorParams(level=LanguageLevel.beginner))
    advanced = build_tutor_instructions(TutorParams(level=LanguageLevel.advanced))

    assert "check understanding" in beginner.lower()
    assert "native-like speech" in advanced.lower()


def test_beginner_uses_english_heavy_language_mix():
    prompt = build_tutor_instructions(TutorParams(level=LanguageLevel.beginner))

    assert "Language mix (beginner)" in prompt
    assert "mostly English" in prompt
    assert "Do not conduct the full conversation in Dutch" in prompt
    assert "one short dutch phrase per turn" in prompt.lower()


def test_beginner_opens_in_english():
    prompt = build_tutor_instructions(TutorParams(level=LanguageLevel.beginner))

    assert "use English only" in prompt
    assert "Do not use Dutch on the first turn" in prompt


def test_voice_delivery_one_language_per_sentence():
    prompt = build_tutor_instructions()

    assert "Voice delivery" in prompt
    assert "one language per sentence" in prompt.lower()
    assert "In Dutch, say:" in prompt


def test_beginner_alternate_english_only_turns():
    prompt = build_tutor_instructions(TutorParams(level=LanguageLevel.beginner))

    assert "English-only turns" in prompt


def test_intermediate_conducts_dialogue_in_target_language():
    prompt = build_tutor_instructions(TutorParams(level=LanguageLevel.intermediate))

    assert "Language mix (intermediate)" in prompt
    assert "Conduct most of the dialogue in Dutch" in prompt


def test_prompt_prioritizes_communication_over_perfection():
    prompt = build_tutor_instructions()

    assert "Never comment on accent" in prompt
    assert "If the student is understood" in prompt
    assert "Prefer recasting" in prompt


def test_beginner_corrects_rarely():
    prompt = build_tutor_instructions(TutorParams(level=LanguageLevel.beginner))

    assert "correct rarely" in prompt.lower()


def test_teaching_loop_in_prompt():
    beginner = build_tutor_instructions(TutorParams(level=LanguageLevel.beginner))
    intermediate = build_tutor_instructions(
        TutorParams(level=LanguageLevel.intermediate)
    )

    assert "one teachable moment per turn" in beginner.lower()
    assert "english-only turns" in beginner.lower()
    assert "When teaching new language" in intermediate


def test_native_practice_audio_forbids_target_on_stream():
    prompt = build_tutor_instructions(native_practice_audio=True)

    assert "Never speak Dutch on the audio stream" in prompt
    assert "speak_practice_phrase" in prompt
    assert "In Dutch, say:" not in prompt
    assert "conversation in Dutch" in prompt


def test_native_practice_defaults_to_dutch_conversation():
    prompt = build_tutor_instructions(
        TutorParams(level=LanguageLevel.intermediate),
        native_practice_audio=True,
    )

    assert "Which language to use" in prompt
    assert "ongoing conversation in Dutch" in prompt
    assert "explanation request" in prompt.lower()


def test_native_practice_beginner_opens_in_dutch_via_tool():
    prompt = build_tutor_instructions(
        TutorParams(level=LanguageLevel.beginner),
        native_practice_audio=True,
    )

    assert "greet in Dutch with speak_practice_phrase" in prompt
    assert "Do not use Dutch on the first turn" not in prompt


def test_prompt_allows_student_led_conversation():
    prompt = build_tutor_instructions()

    assert "Follow the student's lead" in prompt
    assert "not a fixed lesson script" in prompt.lower()
