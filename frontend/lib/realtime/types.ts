export type LanguageLevel = "beginner" | "intermediate" | "advanced";

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
