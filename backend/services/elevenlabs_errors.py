import httpx


def elevenlabs_error_detail(exc: httpx.HTTPStatusError) -> str:
    """Best-effort message from ElevenLabs JSON error body."""
    try:
        data = exc.response.json()
    except ValueError:
        return f"ElevenLabs request failed ({exc.response.status_code})."

    detail = data.get("detail")
    if isinstance(detail, dict):
        message = detail.get("message")
        if isinstance(message, str) and message.strip():
            return message.strip()
    if isinstance(detail, str) and detail.strip():
        return detail.strip()

    return f"ElevenLabs request failed ({exc.response.status_code})."
