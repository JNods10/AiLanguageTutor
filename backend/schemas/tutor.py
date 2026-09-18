from enum import Enum

from pydantic import BaseModel, Field


class LanguageLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class TutorParams(BaseModel):
    target_language: str = Field(
        default="nl",
        min_length=2,
        max_length=10,
        description="ISO 639-1 code for the language the student practices",
    )
    explanation_language: str = Field(
        default="en",
        min_length=2,
        max_length=10,
        description="ISO 639-1 code used for grammar and vocabulary explanations",
    )
    level: LanguageLevel = LanguageLevel.beginner
    scenario: str | None = Field(
        default=None,
        max_length=200,
        description="Optional conversation scenario, e.g. ordering coffee",
    )
