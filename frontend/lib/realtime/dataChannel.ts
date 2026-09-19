import { playPracticePhrase } from "./practicePhrase";

const SPEAK_PRACTICE_PHRASE = "speak_practice_phrase";

/** Ignore back-to-back TTS for the same text (duplicate Realtime events or twin tool calls). */
const PHRASE_DEDUPE_MS = 3_000;

type RealtimeEvent = {
  type?: string;
  response?: {
    output?: Array<{
      type?: string;
      name?: string;
      call_id?: string;
      arguments?: string;
    }>;
  };
  name?: string;
  call_id?: string;
  arguments?: string;
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

async function handleFunctionCall(
  dataChannel: RTCDataChannel,
  tutorAudio: HTMLAudioElement,
  name: string,
  callId: string,
  argsJson: string,
  handledCallIds: Set<string>,
  onError: (message: string) => void,
  phraseHandlers: PracticePhraseHandlers,
  lastPlayedPhrase: { text: string; at: number } | null,
  rememberPlayedPhrase: (entry: { text: string; at: number }) => void,
) {
  if (handledCallIds.has(callId)) {
    return;
  }
  handledCallIds.add(callId);

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

  const now = Date.now();
  if (
    lastPlayedPhrase &&
    lastPlayedPhrase.text === phrase &&
    now - lastPlayedPhrase.at < PHRASE_DEDUPE_MS
  ) {
    submitToolOutput(dataChannel, callId, { ok: true, played: phrase, deduped: true });
    return;
  }

  sendEvent(dataChannel, { type: "response.cancel" });
  const previousVolume = tutorAudio.volume;
  tutorAudio.volume = 0;

  try {
    phraseHandlers.onPracticePhraseStart?.(phrase);
    await playPracticePhrase(phrase, tutorAudio);
    rememberPlayedPhrase({ text: phrase, at: Date.now() });
    phraseHandlers.onPracticePhraseEnd?.(phrase);
    submitToolOutput(dataChannel, callId, { ok: true, played: phrase });
  } catch (err) {
    phraseHandlers.onPracticePhraseEnd?.(phrase);
    const message =
      err instanceof Error ? err.message : "Practice phrase playback failed.";
    onError(message);
    submitToolOutput(dataChannel, callId, { ok: false, error: message });
  } finally {
    tutorAudio.volume = previousVolume;
  }
}

function extractFunctionCalls(event: RealtimeEvent) {
  // Handle only arguments.done — response.done carries the same calls and caused double playback.
  if (event.type !== "response.function_call_arguments.done") {
    return [];
  }

  if (event.name && event.call_id && event.arguments) {
    return [
      {
        name: event.name,
        callId: event.call_id,
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
): () => void {
  const handledCallIds = new Set<string>();
  let lastPlayedPhrase: { text: string; at: number } | null = null;
  let phrasePlaybackChain: Promise<void> = Promise.resolve();

  const onMessage = (messageEvent: MessageEvent) => {
    try {
      const event = JSON.parse(String(messageEvent.data)) as RealtimeEvent;
      const calls = extractFunctionCalls(event);

      for (const call of calls) {
        phrasePlaybackChain = phrasePlaybackChain.then(() =>
          handleFunctionCall(
            dataChannel,
            tutorAudio,
            call.name,
            call.callId,
            call.arguments,
            handledCallIds,
            onError,
            phraseHandlers,
            lastPlayedPhrase,
            (entry) => {
              lastPlayedPhrase = entry;
            },
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
  };
}
