import type { CefrLevel } from "@/lib/levels";

export type AgentSessionParams = {
  targetLanguage: string;
  explanationLanguage?: string;
  level?: CefrLevel;
  scenario?: string | null;
};

export type AgentSessionOverrides = {
  agent: {
    prompt?: { prompt: string };
    firstMessage?: string;
    language?: string;
  };
  tts?: {
    voiceId?: string;
  };
  conversation?: {
    textOnly?: boolean;
  };
};

export type CreateAgentConversationResponse = {
  conversationToken: string;
  agentId: string;
  overrides: AgentSessionOverrides;
  dynamicVariables: Record<string, string | number | boolean>;
};

export type ElevenLabsVoiceStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error";
