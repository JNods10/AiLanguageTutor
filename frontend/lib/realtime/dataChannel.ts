import {
  classifyPhraseRepeat,
  logTurnDiagnostic,
} from "./turnDiagnostics";
import { normalizePracticePhrase, playPracticePhrase } from "./practicePhrase";

const SPEAK_PRACTICE_PHRASE = "speak_practice_phrase";
const EXPLAIN_IN_ENGLISH = "explain_in_english";
const SET_CONVERSATION_MODE = "set_conversation_mode";

/** Ignore back-to-back TTS for the same text (duplicate tool calls). */
const PHRASE_DEDUPE_MS = 8_000;

const POST_PHRASE_GAP_MS = 250;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type ConversationMode =
  | "free_chat"
  | "structured_lesson"
  | "explain_focus";

type RealtimeEvent = {
  type?: string;
  name?: string;
  call_id?: string;
  item_id?: string;
  arguments?: string;
  transcript?: string;
  item?: {
    type?: string;
    name?: string;
    call_id?: string;
  };
};

type FunctionCallPayload = {
  name: string;
  callId: string;
  itemId: string | undefined;
  arguments: string;
};

function sendEvent(dataChannel: RTCDataChannel, event: object) {
  if (dataChannel.readyState !== "open") {
    return;
  }
  dataChannel.send(JSON.stringify(event));
}

function submitToolOutputItem(
  dataChannel: RTCDataChannel,
  callId: string,
  output: object,
) {
  sendEvent(dataChannel, {
    type: "conversation.item.create",
    item: {
      type: "function_call_output",
      call_id: callId,
      output: JSON.stringify(output),
    },
  });
}

function continueAssistantResponse(dataChannel: RTCDataChannel) {
  sendEvent(dataChannel, { type: "response.create" });
}

/** English follow-up after Dutch TTS usually comes from response.create; skip for Dutch-only turns. */
function shouldContinueAssistantAfterTools(
  batch: FunctionCallPayload[],
): boolean {
  return batch.some((call) => call.name === EXPLAIN_IN_ENGLISH);
}

type DataChannelHandlers = {
  onPracticePhraseStart?: (phrase: string) => void;
  onPracticePhraseEnd?: (phrase: string) => void;
  onConversationModeChange?: (mode: ConversationMode, note?: string) => void;
};

type RemoteAudioRef = { track: MediaStreamTrack | null };

type StreamSuppressState = {
  savedVolume: number;
  suppressing: boolean;
  remoteAudio: RemoteAudioRef;
};

function suppressOpenAiStream(
  tutorAudio: HTMLAudioElement,
  state: StreamSuppressState,
): void {
  if (!state.suppressing) {
    state.savedVolume = tutorAudio.volume;
    state.suppressing = true;
    logTurnDiagnostic("stream_suppress");
  }
  tutorAudio.volume = 0;
  if (state.remoteAudio.track) {
    state.remoteAudio.track.enabled = false;
  }
}

function restoreOpenAiStream(
  tutorAudio: HTMLAudioElement,
  state: StreamSuppressState,
): void {
  if (!state.suppressing) {
    return;
  }
  if (state.remoteAudio.track) {
    state.remoteAudio.track.enabled = true;
  }
  tutorAudio.volume = state.savedVolume;
  state.suppressing = false;
  logTurnDiagnostic("stream_restore");
}

function isNativePhraseToolEvent(event: RealtimeEvent): boolean {
  if (event.name === SPEAK_PRACTICE_PHRASE) {
    return true;
  }

  if (
    event.item?.type === "function_call" &&
    event.item.name === SPEAK_PRACTICE_PHRASE
  ) {
    return true;
  }

  return false;
}

function parseConversationMode(value: string): ConversationMode | null {
  if (
    value === "free_chat" ||
    value === "structured_lesson" ||
    value === "explain_focus"
  ) {
    return value;
  }
  return null;
}

async function handleFunctionCall(
  dataChannel: RTCDataChannel,
  tutorAudio: HTMLAudioElement,
  streamState: StreamSuppressState,
  call: FunctionCallPayload,
  handledCallIds: Set<string>,
  handledItemIds: Set<string>,
  onError: (message: string) => void,
  handlers: DataChannelHandlers,
  lastPlayedPhrase: { text: string; at: number } | null,
  rememberPlayedPhrase: (entry: { text: string; at: number }) => void,
  phraseInFlight: { text: string | null },
  playedPhraseHistory: string[],
): Promise<boolean> {
  const { name, callId, itemId, arguments: argsJson } = call;

  if (handledCallIds.has(callId)) {
    return false;
  }
  if (itemId && handledItemIds.has(itemId)) {
    return false;
  }

  handledCallIds.add(callId);
  if (itemId) {
    handledItemIds.add(itemId);
  }

  logTurnDiagnostic("tool_call", { name, callId, argsJson });

  if (name === EXPLAIN_IN_ENGLISH) {
    let topic = "";
    try {
      const parsed = JSON.parse(argsJson) as { topic?: string };
      topic = parsed.topic?.trim() ?? "";
    } catch {
      onError("Could not parse explain_in_english arguments.");
      submitToolOutputItem(dataChannel, callId, {
        ok: false,
        error: "Invalid arguments",
      });
      logTurnDiagnostic("tool_result", { name, ok: false });
      return true;
    }
    submitToolOutputItem(dataChannel, callId, {
      ok: true,
      topic: topic || "explanation",
    });
    logTurnDiagnostic("tool_result", { name, ok: true, topic });
    return true;
  }

  if (name === SET_CONVERSATION_MODE) {
    try {
      const parsed = JSON.parse(argsJson) as { mode?: string; note?: string };
      const mode = parseConversationMode(parsed.mode ?? "");
      if (!mode) {
        submitToolOutputItem(dataChannel, callId, {
          ok: false,
          error: "Invalid mode",
        });
        logTurnDiagnostic("tool_result", { name, ok: false });
        return true;
      }
      const note = parsed.note?.trim();
      handlers.onConversationModeChange?.(mode, note || undefined);
      submitToolOutputItem(dataChannel, callId, { ok: true, mode, note });
      logTurnDiagnostic("tool_result", { name, ok: true, mode, note });
    } catch {
      onError("Could not parse set_conversation_mode arguments.");
      submitToolOutputItem(dataChannel, callId, {
        ok: false,
        error: "Invalid arguments",
      });
      logTurnDiagnostic("tool_result", { name, ok: false });
    }
    return true;
  }

  if (name !== SPEAK_PRACTICE_PHRASE) {
    submitToolOutputItem(dataChannel, callId, {
      ok: false,
      error: "Unknown tool",
    });
    logTurnDiagnostic("tool_result", { name, ok: false, error: "Unknown tool" });
    return true;
  }

  let phrase = "";
  try {
    const parsed = JSON.parse(argsJson) as { phrase?: string };
    phrase = parsed.phrase?.trim() ?? "";
  } catch {
    onError("Could not parse speak_practice_phrase arguments.");
    submitToolOutputItem(dataChannel, callId, {
      ok: false,
      error: "Invalid arguments",
    });
    logTurnDiagnostic("tool_result", { name, ok: false });
    return true;
  }

  if (!phrase) {
    submitToolOutputItem(dataChannel, callId, {
      ok: false,
      error: "Missing phrase",
    });
    logTurnDiagnostic("tool_result", { name, ok: false });
    return true;
  }

  const normalized = normalizePracticePhrase(phrase);
  const now = Date.now();
  const repeatKind = classifyPhraseRepeat(phrase, playedPhraseHistory);
  if (repeatKind) {
    logTurnDiagnostic("repeat_suspected", { phrase: normalized, repeatKind });
  }

  if (phraseInFlight.text === normalized) {
    submitToolOutputItem(dataChannel, callId, {
      ok: true,
      played: phrase,
      deduped: true,
    });
    logTurnDiagnostic("tool_result", { name, ok: true, deduped: true });
    return true;
  }

  if (
    lastPlayedPhrase &&
    lastPlayedPhrase.text === normalized &&
    now - lastPlayedPhrase.at < PHRASE_DEDUPE_MS
  ) {
    submitToolOutputItem(dataChannel, callId, {
      ok: true,
      played: phrase,
      deduped: true,
    });
    logTurnDiagnostic("tool_result", { name, ok: true, deduped: true });
    return true;
  }

  const handoffStarted = Date.now();
  suppressOpenAiStream(tutorAudio, streamState);
  phraseInFlight.text = normalized;
  rememberPlayedPhrase({ text: normalized, at: now });
  playedPhraseHistory.push(normalized);

  try {
    handlers.onPracticePhraseStart?.(phrase);
    await playPracticePhrase(phrase, tutorAudio);
    handlers.onPracticePhraseEnd?.(phrase);
    submitToolOutputItem(dataChannel, callId, {
      ok: true,
      played: phrase,
      turn_complete: true,
    });
    logTurnDiagnostic("tool_result", {
      name,
      ok: true,
      played: phrase,
      handoffMs: Date.now() - handoffStarted,
      streamSuppressed: streamState.suppressing,
      turnComplete: true,
    });
    await sleep(POST_PHRASE_GAP_MS);
  } catch (err) {
    handlers.onPracticePhraseEnd?.(phrase);
    const message =
      err instanceof Error ? err.message : "Practice phrase playback failed.";
    onError(message);
    submitToolOutputItem(dataChannel, callId, { ok: false, error: message });
    logTurnDiagnostic("tool_result", { name, ok: false, error: message });
  } finally {
    phraseInFlight.text = null;
    restoreOpenAiStream(tutorAudio, streamState);
  }

  return true;
}

function extractFunctionCalls(event: RealtimeEvent): FunctionCallPayload[] {
  if (event.type !== "response.function_call_arguments.done") {
    return [];
  }

  if (event.name && event.call_id && event.arguments) {
    return [
      {
        name: event.name,
        callId: event.call_id,
        itemId: event.item_id,
        arguments: event.arguments,
      },
    ];
  }

  return [];
}

function logTranscriptionEvents(event: RealtimeEvent): void {
  if (
    event.type ===
      "conversation.item.input_audio_transcription.completed" &&
    event.transcript
  ) {
    logTurnDiagnostic("user_transcript", { text: event.transcript });
  }

  if (event.type === "input_audio_buffer.speech_stopped") {
    logTurnDiagnostic("user_speech_stopped");
  }

  if (
    event.type === "response.audio_transcript.done" &&
    event.transcript
  ) {
    logTurnDiagnostic("assistant_transcript", { text: event.transcript });
  }
}

export function attachRealtimeDataChannelHandler(
  dataChannel: RTCDataChannel,
  tutorAudio: HTMLAudioElement,
  onError: (message: string) => void,
  handlers: DataChannelHandlers = {},
  remoteAudio: RemoteAudioRef = { track: null },
): () => void {
  const handledCallIds = new Set<string>();
  const handledItemIds = new Set<string>();
  const streamState: StreamSuppressState = {
    savedVolume: 1,
    suppressing: false,
    remoteAudio,
  };
  const phraseInFlight = { text: null as string | null };
  let lastPlayedPhrase: { text: string; at: number } | null = null;
  const playedPhraseHistory: string[] = [];
  let phrasePlaybackChain: Promise<void> = Promise.resolve();
  const pendingCalls: FunctionCallPayload[] = [];

  const onMessage = (messageEvent: MessageEvent) => {
    try {
      const event = JSON.parse(String(messageEvent.data)) as RealtimeEvent;

      logTranscriptionEvents(event);

      if (
        (event.type === "response.function_call_arguments.delta" ||
          event.type === "response.output_item.added") &&
        isNativePhraseToolEvent(event)
      ) {
        suppressOpenAiStream(tutorAudio, streamState);
      }

      const calls = extractFunctionCalls(event);
      if (calls.length > 0) {
        pendingCalls.push(...calls);
      }

      if (event.type === "response.done") {
        logTurnDiagnostic("response_done", {
          pendingToolCalls: pendingCalls.length,
        });

        const batch = pendingCalls.splice(0, pendingCalls.length);

        if (batch.length === 0 && phraseInFlight.text === null) {
          restoreOpenAiStream(tutorAudio, streamState);
          return;
        }

        phrasePlaybackChain = phrasePlaybackChain.then(async () => {
          let submittedAny = false;
          for (const call of batch) {
            const submitted = await handleFunctionCall(
              dataChannel,
              tutorAudio,
              streamState,
              call,
              handledCallIds,
              handledItemIds,
              onError,
              handlers,
              lastPlayedPhrase,
              (entry) => {
                lastPlayedPhrase = entry;
              },
              phraseInFlight,
              playedPhraseHistory,
            );
            if (submitted) {
              submittedAny = true;
            }
          }
          if (submittedAny && shouldContinueAssistantAfterTools(batch)) {
            continueAssistantResponse(dataChannel);
          } else if (submittedAny) {
            logTurnDiagnostic("response_done", {
              skippedResponseCreate: true,
              reason: "dutch_only_tool_turn",
            });
          }
        });
      }
    } catch {
      // Ignore non-JSON or unrelated events.
    }
  };

  dataChannel.addEventListener("message", onMessage);

  return () => {
    dataChannel.removeEventListener("message", onMessage);
    restoreOpenAiStream(tutorAudio, streamState);
  };
}
