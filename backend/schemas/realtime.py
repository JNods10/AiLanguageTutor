from pydantic import BaseModel, ConfigDict, Field

from schemas.tutor import LanguageLevel, TutorParams


class CreateSessionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    target_language: str = Field(
        default="nl",
        alias="targetLanguage",
        min_length=2,
        max_length=10,
    )
    explanation_language: str = Field(
        default="en",
        alias="explanationLanguage",
        min_length=2,
        max_length=10,
    )
    level: LanguageLevel = LanguageLevel.beginner
    scenario: str | None = Field(default=None, max_length=200)

    def to_tutor_params(self) -> TutorParams:
        return TutorParams(
            target_language=self.target_language,
            explanation_language=self.explanation_language,
            level=self.level,
            scenario=self.scenario,
        )


class CreateSessionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    client_secret: str = Field(alias="clientSecret")
    expires_at: int | None = Field(default=None, alias="expiresAt")
    session: dict[str, object]
