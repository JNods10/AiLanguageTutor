SPEAK_PRACTICE_PHRASE = "speak_practice_phrase"


def append_native_practice_tts_instructions(
    instructions: str, practice: str, explain: str
) -> str:
    return f"""{instructions}

# Native practice-language audio (required)
- Your OpenAI voice stream must use {explain} only. Do not speak {practice} on the Realtime audio output.
- Whenever the student should hear {practice} (modeling, examples, prompts to repeat), call the `{SPEAK_PRACTICE_PHRASE}` tool with the exact phrase.
- Before calling the tool, you may say in {explain} what the phrase means (e.g. "In {practice}, say:").
- After the tool plays, continue in {explain} with encouragement or a simple question.
- Never skip the tool for {practice} words you want the student to learn.
"""
