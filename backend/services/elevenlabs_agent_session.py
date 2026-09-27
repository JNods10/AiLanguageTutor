from schemas.cefr import CefrLevel


def build_agent_session_overrides(target_language: str) -> dict[str, object]:
    """Minimal overrides — system prompt lives in the ElevenLabs agent dashboard."""
    return {
        "agent": {
            "language": target_language.strip().lower(),
        },
    }


def build_dynamic_variables(level: CefrLevel) -> dict[str, str]:
    """Values for {{level}} and other dashboard dynamic variables."""
    return {
        "level": level.value,
    }
