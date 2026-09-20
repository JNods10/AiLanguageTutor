import httpx

from config import settings
from prompts.tutor import language_name

OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"
TRANSLATE_MODEL = "gpt-4o-mini"


async def translate_text(
    text: str,
    source_language: str,
    target_language: str,
) -> str:
    source = language_name(source_language)
    target = language_name(target_language)

    payload = {
        "model": TRANSLATE_MODEL,
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": (
                    f"You translate {source} to {target} for language learners. "
                    "Return only the translation, no quotes or extra commentary. "
                    "Preserve tone (formal/informal) when obvious from context."
                ),
            },
            {"role": "user", "content": text.strip()},
        ],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            OPENAI_CHAT_COMPLETIONS_URL,
            headers={
                "Authorization": f"Bearer {settings.openai_api_key.get_secret_value()}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ValueError("OpenAI returned no translation choices.")

    message = choices[0].get("message")
    if not isinstance(message, dict):
        raise ValueError("OpenAI returned an invalid message.")

    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise ValueError("OpenAI returned empty translation.")

    return content.strip()
