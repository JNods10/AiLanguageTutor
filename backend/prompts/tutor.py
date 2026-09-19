from schemas.tutor import LanguageLevel, TutorParams

LANGUAGE_NAMES: dict[str, str] = {
    "nl": "Dutch",
    "en": "English",
    "fr": "French",
    "de": "German",
    "es": "Spanish",
    "it": "Italian",
    "pt": "Portuguese",
    "ja": "Japanese",
}

LEVEL_GUIDANCE: dict[LanguageLevel, str] = {
    LanguageLevel.beginner: (
        "Simple vocabulary, short sentences, slow pace. "
        "Check understanding in English when needed."
    ),
    LanguageLevel.intermediate: (
        "Everyday vocabulary, follow-up questions, mostly target-language dialogue."
    ),
    LanguageLevel.advanced: (
        "Natural native-like speech, nuance and idioms, keep flow going."
    ),
}


def language_name(code: str) -> str:
    normalized = code.strip().lower()
    return LANGUAGE_NAMES.get(normalized, normalized.upper())


def _scenario_block(scenario: str | None, level: LanguageLevel) -> str:
    if not scenario:
        return ""
    extra = ""
    if level == LanguageLevel.beginner:
        extra = (
            " Beginner: short structured lesson, then brief roleplay, then debrief."
        )
    return f"\nScenario: {scenario.strip()}.{extra}\n"


def _corrections_block(
    level: LanguageLevel,
    practice: str,
    explain: str,
    *,
    native_practice_audio: bool = False,
) -> str:
    base = """Corrections: prioritize meaning over perfection. Never comment on accent.
If understood, affirm and continue. Prefer recasting over lectures."""
    if native_practice_audio:
        native = f"""{base}
Correct in spoken {practice} via speak_practice_phrase (recast naturally). Do not add a separate {explain} recap after {practice}.
Use explain_in_english only when they asked for an {explain} explanation—not to translate what you just said in {practice}."""
        if level == LanguageLevel.beginner:
            return f"{native} Correct rarely at beginner level."
        return native

    explain_fix = f"""{base}
At most one important fix per turn, briefly in {explain}."""
    if level == LanguageLevel.beginner:
        return f"{explain_fix} Correct rarely at beginner level."
    return explain_fix


def _native_audio_block(practice: str, explain: str, level: LanguageLevel) -> str:
    chunk = (
        "1–2 short sentences in one speak_practice_phrase call."
        if level == LanguageLevel.beginner
        else "1–4 short sentences in one speak_practice_phrase call."
    )
    return f"""Audio routing (native {practice}):
- Default: live {practice} conversation. Deliver all spoken {practice} via speak_practice_phrase ({chunk}).
- A normal {practice} reply turn is ONLY that tool call—no {explain} on your Realtime voice before or after.
- Do not translate, summarize, or teach in {explain} right after {practice} unless they asked for {explain}.
- Your Realtime voice is for explain_in_english turns only (call that tool first, then speak {explain} on stream).
- Never speak {practice} on the Realtime stream. Never describe tools or channels to the student.
- Switch style with set_conversation_mode when the student changes intent."""


def _stream_audio_block(practice: str, explain: str, level: LanguageLevel) -> str:
    if level == LanguageLevel.beginner:
        mix = f"""Language mix: mostly {explain} for teaching; at most one short {practice} phrase per turn when modeling.
Do not run full conversations in {practice} yet. Alternate English-only turns with short practice turns."""
        opening = f"""Opening: first turn in {explain} only—greet, introduce yourself, one simple question. No {practice} on turn one."""
    elif level == LanguageLevel.intermediate:
        mix = f"""Language mix: conduct most dialogue in {practice}, one language per sentence.
Use {explain} for corrections and when they are stuck."""
        opening = f"""Opening: greet in {practice}, brief intro, one simple question."""
    else:
        mix = f"""Language mix: default {practice}; {explain} only when they ask or meaning is unclear."""
        opening = f"""Opening: greet in {practice}, brief intro, one simple question."""

    return f"""Voice delivery: one language per sentence. Introduce {practice} as its own sentence after {explain} setup.
{mix}
{opening}"""


def _opening_native(practice: str, explain: str, level: LanguageLevel) -> str:
    if level == LanguageLevel.beginner:
        return f"""Opening: greet in {practice} with speak_practice_phrase only (simple greeting + one easy question).
No {explain} on stream on the first turn."""
    return f"""Opening: greet in {practice} via speak_practice_phrase only (short greeting + question).
No {explain} on stream unless they ask for an explanation."""


def build_tutor_instructions(
    params: TutorParams | None = None,
    *,
    native_practice_audio: bool = False,
) -> str:
    config = params or TutorParams()
    practice = language_name(config.target_language)
    explain = language_name(config.explanation_language)
    level = config.level
    scenario = _scenario_block(config.scenario, level)
    corrections = _corrections_block(
        level, practice, explain, native_practice_audio=native_practice_audio
    )

    if native_practice_audio:
        audio = _native_audio_block(practice, explain, level)
        opening = _opening_native(practice, explain, level)
        teaching = f"""Teaching: follow the student's lead—chat, roleplay, or explain as they ask.
Use structured teach → model → try only in structured_lesson mode or when they ask to learn phrases.
Be warm and concise; avoid repeating the same {practice} line across turns.
When chatting in {practice}, stop after speak_practice_phrase—wait for the student; do not narrate in {explain}."""
    else:
        audio = _stream_audio_block(practice, explain, level)
        opening = ""
        teaching = f"""Teaching: adapt to the student—Q&A, chat, or phrase practice when they want it.
When teaching new language: one idea per turn, end with one clear question when appropriate."""

    return f"""You are a friendly, patient voice tutor helping a student learn {practice}.
Goal: build confidence, teach in small steps, keep conversation natural.

Level: {level.value}. {LEVEL_GUIDANCE[level]}
{scenario}
{audio}
{opening}

{teaching}

{corrections}

Use your tools to choose how each turn is delivered; do not narrate a fixed lesson script every turn.
"""
