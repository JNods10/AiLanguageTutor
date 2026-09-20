SPEAK_PRACTICE_PHRASE = "speak_practice_phrase"
EXPLAIN_IN_ENGLISH = "explain_in_english"
SET_CONVERSATION_MODE = "set_conversation_mode"

SPEAK_PRACTICE_PHRASE_TOOL: dict[str, object] = {
    "type": "function",
    "name": SPEAK_PRACTICE_PHRASE,
    "description": (
        "Speak the target practice language with native pronunciation. "
        "Use for normal conversational replies (default)—not mini-lessons. "
        "Greetings, chat, roleplay, answers to their questions. "
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
        "Use when the student explicitly asked to be taught or explained something "
        "in English (grammar, meaning, how-to, culture, 'teach me', 'what does X mean'). "
        "Do not use during casual chat. Call once at the start of that turn, "
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
        "Switch tutoring style when the student clearly changes intent. "
        "Default is free_chat—do not call this every turn. "
        "Use free_chat for normal conversation; structured_lesson only when they "
        "ask for a lesson or phrase drill; explain_focus when they want extended "
        "English explanations. Examples: 'let's just chat', 'teach me a lesson'."
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
