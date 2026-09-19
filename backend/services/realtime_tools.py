SPEAK_PRACTICE_PHRASE_TOOL: dict[str, object] = {
    "type": "function",
    "name": "speak_practice_phrase",
    "description": (
        "Play the given practice-language phrase using native pronunciation audio. "
        "Use this for every phrase the student should hear in the target language."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "phrase": {
                "type": "string",
                "description": "Exact text to speak in the target practice language.",
            },
        },
        "required": ["phrase"],
    },
}
