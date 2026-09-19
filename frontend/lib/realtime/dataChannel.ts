import { normalizePracticePhrase, playPracticePhrase } from "./practicePhrase";

const SPEAK_PRACTICE_PHRASE = "speak_practice_phrase";

/** Ignore back-to-back TTS for the same text (duplicate tool calls). */
const PHRASE_DEDUPE_MS = 8_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type RealtimeEvent = {
  type?: string;
  name?: string;
  call_id?: string;
  item_id?: string;
  arguments?: string;
  item?: {
    type?: string;
    name?: string;
    call_id?: string;
  };
};

function sendEvent(dataChannel: RTCDataChannel, event: object) {
  if (dataChannel.readyState !== "open") {
    return;
  }
  dataChannel.send(JSON.stringify(event));
}

function submitToolOutput(
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
  sendEvent(dataChannel, { type: "response.create" });
}

type PracticePhraseHandlers = {
  onPracticePhraseStart?: (phrase: string) => void;
  onPracticePhraseEnd?: (phrase: string) => void;
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

async function handleFunctionCall(
  dataChannel: RTCDataChannel,
  tutorAudio: HTMLAudioElement,
  streamState: StreamSuppressState,
  name: string,
  callId: string,
  itemId: string | undefined,
  argsJson: string,
  handledCallIds: Set<string>,
  handledItemIds: Set<string>,
  onError: (message: string) => void,
  phraseHandlers: PracticePhraseHandlers,
  lastPlayedPhrase: { text: string; at: number } | null,
  rememberPlayedPhrase: (entry: { text: string; at: number }) => void,
  phraseInFlight: { text: string | null },
) {
  if (handledCallIds.has(callId)) {
    return;
  }
  if (itemId && handledItemIds.has(itemId)) {
    return;
  }

  handledCallIds.add(callId);
  if (itemId) {
    handledItemIds.add(itemId);
  }

  if (name !== SPEAK_PRACTICE_PHRASE) {
    submitToolOutput(dataChannel, callId, {
      ok: false,
      error: "Unknown tool",
    });
    return;
  }

  let phrase = "";
  try {
    const parsed = JSON.parse(argsJson) as { phrase?: string };
    phrase = parsed.phrase?.trim() ?? "";
  } catch {
    onError("Could not parse speak_practice_phrase arguments.");
    submitToolOutput(dataChannel, callId, {
      ok: false,
      error: "Invalid arguments",
    });
    return;
  }

  if (!phrase) {
    submitToolOutput(dataChannel, callId, {
      ok: false,
      error: "Missing phrase",
    });
    return;
  }

  const normalized = normalizePracticePhrase(phrase);
  const now = Date.now();

  if (phraseInFlight.text === normalized) {
    submitToolOutput(dataChannel, callId, { ok: true, played: phrase, deduped: true });
    return;
  }

  if (
    lastPlayedPhrase &&
    lastPlayedPhrase.text === normalized &&
    now - lastPlayedPhrase.at < PHRASE_DEDUPE_MS
  ) {
    submitToolOutput(dataChannel, callId, { ok: true, played: phrase, deduped: true });
    return;
  }

  suppressOpenAiStream(tutorAudio, streamState);
  phraseInFlight.text = normalized;
  rememberPlayedPhrase({ text: normalized, at: now });

  try {
    phraseHandlers.onPracticePhraseStart?.(phrase);
    await playPracticePhrase(phrase, tutorAudio);
    phraseHandlers.onPracticePhraseEnd?.(phrase);
    submitToolOutput(dataChannel, callId, { ok: true, played: phrase });
    // Keep OpenAI muted briefly so follow-up response audio does not overlap the clip.
    await sleep(400);
  } catch (err) {
    phraseHandlers.onPracticePhraseEnd?.(phrase);
    const message =
      err instanceof Error ? err.message : "Practice phrase playback failed.";
    onError(message);
    submitToolOutput(dataChannel, callId, { ok: false, error: message });
  } finally {
    phraseInFlight.text = null;
    restoreOpenAiStream(tutorAudio, streamState);
  }
}

function extractFunctionCalls(event: RealtimeEvent) {
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

export function attachRealtimeDataChannelHandler(
  dataChannel: RTCDataChannel,
  tutorAudio: HTMLAudioElement,
  onError: (message: string) => void,
  phraseHandlers: PracticePhraseHandlers = {},
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
  let phrasePlaybackChain: Promise<void> = Promise.resolve();

  const onMessage = (messageEvent: MessageEvent) => {
    try {
      const event = JSON.parse(String(messageEvent.data)) as RealtimeEvent;

      if (
        (event.type === "response.function_call_arguments.delta" ||
          event.type === "response.output_item.added") &&
        isNativePhraseToolEvent(event)
      ) {
        suppressOpenAiStream(tutorAudio, streamState);
      }

      if (event.type === "response.done" && phraseInFlight.text === null) {
        restoreOpenAiStream(tutorAudio, streamState);
      }

      const calls = extractFunctionCalls(event);

      for (const call of calls) {
        phrasePlaybackChain = phrasePlaybackChain.then(() =>
          handleFunctionCall(
            dataChannel,
            tutorAudio,
            streamState,
            call.name,
            call.callId,
            call.itemId,
            call.arguments,
            handledCallIds,
            handledItemIds,
            onError,
            phraseHandlers,
            lastPlayedPhrase,
            (entry) => {
              lastPlayedPhrase = entry;
            },
            phraseInFlight,
          ),
        );
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
