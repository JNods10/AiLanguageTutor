SPEAK_PRACTICE_PHRASE_TOOL: dict[str, object] = {
    "type": "function",
    "name": "speak_practice_phrase",
    "description": (
        "Speak text in the target practice language using native pronunciation audio. "
        "Use for single phrases, examples, and full conversational turns (several sentences). "
        "All target-language speech the student should hear must use this tool—not your Realtime voice."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "phrase": {
                "type": "string",
                "description": (
                    "Target-language text to speak (one phrase or a short conversational utterance)."
                ),
            },
        },
        "required": ["phrase"],
    },
}
