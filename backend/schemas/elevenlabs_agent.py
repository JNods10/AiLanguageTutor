from pydantic import BaseModel, ConfigDict, Field

from schemas.cefr import CefrLevel


class CreateAgentConversationRequest(BaseModel):
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
    level: CefrLevel = CefrLevel.a1
    scenario: str | None = Field(default=None, max_length=200)


class AgentSessionOverrides(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    agent: dict[str, object]


class CreateAgentConversationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    conversation_token: str = Field(alias="conversationToken")
    agent_id: str = Field(alias="agentId")
    overrides: AgentSessionOverrides
    dynamic_variables: dict[str, str | int | bool] = Field(alias="dynamicVariables")
