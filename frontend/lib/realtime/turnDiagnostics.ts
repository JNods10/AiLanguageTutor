export type TurnDiagnosticKind =
  | "user_transcript"
  | "user_speech_stopped"
  | "assistant_transcript"
  | "tool_call"
  | "tool_result"
  | "stream_suppress"
  | "stream_restore"
  | "response_done"
  | "repeat_suspected";

export type TurnDiagnosticEvent = {
  kind: TurnDiagnosticKind;
  at: number;
  detail?: Record<string, unknown>;
};

const MAX_EVENTS = 200;

let events: TurnDiagnosticEvent[] = [];

export function isTurnDiagnosticsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_REALTIME_DEBUG === "1"
  );
}

export function logTurnDiagnostic(
  kind: TurnDiagnosticKind,
  detail?: Record<string, unknown>,
): void {
  if (!isTurnDiagnosticsEnabled()) {
    return;
  }

  const entry: TurnDiagnosticEvent = {
    kind,
    at: Date.now(),
    detail,
  };
  events.push(entry);
  if (events.length > MAX_EVENTS) {
    events = events.slice(-MAX_EVENTS);
  }

  console.debug("[realtime-turn]", kind, detail ?? {});
}

export function getTurnDiagnosticEvents(): readonly TurnDiagnosticEvent[] {
  return events;
}

export function resetTurnDiagnostics(): void {
  events = [];
}

export function classifyPhraseRepeat(
  phrase: string,
  priorPhrases: string[],
): "duplicate_tool" | "recast_next_turn" | null {
  const normalized = phrase.trim().replace(/\s+/g, " ").toLowerCase();
  if (priorPhrases.some((p) => p === normalized)) {
    return "duplicate_tool";
  }
  return null;
}
