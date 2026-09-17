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


def test_level_guidance_varies_by_level():
    beginner = build_tutor_instructions(TutorParams(level=LanguageLevel.beginner))
    advanced = build_tutor_instructions(TutorParams(level=LanguageLevel.advanced))

    assert "simple vocabulary" in beginner.lower()
    assert "native-like speech" in advanced.lower()


def test_prompt_includes_correction_and_switching_rules():
    prompt = build_tutor_instructions()

    assert "Correct at most one important mistake per turn" in prompt
    assert "Do not switch based on accent" in prompt
    assert "If the student makes a mistake while practicing Dutch" in prompt
