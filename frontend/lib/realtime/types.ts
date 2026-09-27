import type { OpenAiPracticeLevel } from "@/lib/levels";

/** OpenAI Realtime session level (legacy three-band scale). */
export type LanguageLevel = OpenAiPracticeLevel;

export type SessionParams = {
  targetLanguage: string;
  explanationLanguage?: string;
  level?: LanguageLevel;
  scenario?: string | null;
};

export type CreateSessionResponse = {
  clientSecret: string;
  expiresAt?: number | null;
  session: Record<string, unknown>;
};

export type VoiceConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error";
