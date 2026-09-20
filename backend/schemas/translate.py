from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    source_language: str = Field(default="nl", min_length=2, max_length=8)
    target_language: str = Field(default="en", min_length=2, max_length=8)


class TranslateResponse(BaseModel):
    translation: str
