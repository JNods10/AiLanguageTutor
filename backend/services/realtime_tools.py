SPEAK_PRACTICE_PHRASE = "speak_practice_phrase"
EXPLAIN_IN_ENGLISH = "explain_in_english"
SET_CONVERSATION_MODE = "set_conversation_mode"

SPEAK_PRACTICE_PHRASE_TOOL: dict[str, object] = {
    "type": "function",
    "name": SPEAK_PRACTICE_PHRASE,
    "description": (
        "Speak the target practice language with native pronunciation. "
        "Use for conversational replies: greetings, chat, roleplay, and models. "
        "Put the full reply in one call (1–4 short sentences). This completes the "
        "spoken turn—do not add English on your Realtime voice after it unless "
        "explain_in_english was called for that turn. Do not call twice with the "
        "same or overlapping text. Do not speak the target language on Realtime "
        "voice—only through this tool."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "phrase": {
                "type": "string",
                "description": (
                    "Complete Dutch utterance for this turn (not a fragment repeated "
                    "from a prior turn)."
                ),
            },
        },
        "required": ["phrase"],
    },
}

EXPLAIN_IN_ENGLISH_TOOL: dict[str, object] = {
    "type": "function",
    "name": EXPLAIN_IN_ENGLISH,
    "description": (
        "Use when the student clearly asked for an English explanation (grammar, "
        "meaning, how-to, or culture). Call this once at the start of that turn, "
        "then answer entirely in English on your Realtime voice. Do not use "
        "speak_practice_phrase in the same turn unless they immediately ask to "
        "practice Dutch again."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "topic": {
                "type": "string",
                "description": "Short label for what you are explaining.",
            },
        },
        "required": ["topic"],
    },
}

SET_CONVERSATION_MODE_TOOL: dict[str, object] = {
    "type": "function",
    "name": SET_CONVERSATION_MODE,
    "description": (
        "Update tutoring mode when the student changes intent: casual chat, "
        "structured lesson, or focused English explanations. Call when they ask "
        "to switch style (e.g. 'let's just chat', 'teach me a lesson', "
        "'explain in English'). Optional at session start if scenario implies a mode."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "mode": {
                "type": "string",
                "enum": ["free_chat", "structured_lesson", "explain_focus"],
                "description": "How to run the conversation from here.",
            },
            "note": {
                "type": "string",
                "description": "Optional one-line note for the student-facing UI.",
            },
        },
        "required": ["mode"],
    },
}

REALTIME_TUTOR_TOOLS: list[dict[str, object]] = [
    SPEAK_PRACTICE_PHRASE_TOOL,
    EXPLAIN_IN_ENGLISH_TOOL,
    SET_CONVERSATION_MODE_TOOL,
]
