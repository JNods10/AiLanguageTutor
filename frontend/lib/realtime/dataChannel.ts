import { playPracticePhrase } from "./practicePhrase";

const SPEAK_PRACTICE_PHRASE = "speak_practice_phrase";

/** Ignore back-to-back TTS for the same text (duplicate events or twin tool calls). */
const PHRASE_DEDUPE_MS = 5_000;

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
  response?: {
    output?: Array<{
      type?: string;
      name?: string;
      call_id?: string;
      arguments?: string;
    }>;
  };
};

function normalizePhrase(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

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

type TutorMuteState = {
  savedVolume: number;
  depth: number;
};

function ensureTutorMuted(
  tutorAudio: HTMLAudioElement,
  muteState: TutorMuteState,
): void {
  if (muteState.depth === 0) {
    muteState.savedVolume = tutorAudio.volume;
    tutorAudio.volume = 0;
  }
  muteState.depth += 1;
}

function releaseTutorMute(
  tutorAudio: HTMLAudioElement,
  muteState: TutorMuteState,
): void {
  muteState.depth = Math.max(0, muteState.depth - 1);
  if (muteState.depth === 0) {
    tutorAudio.volume = muteState.savedVolume;
  }
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
  muteState: TutorMuteState,
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

  const normalized = normalizePhrase(phrase);
  const now = Date.now();
  if (
    lastPlayedPhrase &&
    lastPlayedPhrase.text === normalized &&
    now - lastPlayedPhrase.at < PHRASE_DEDUPE_MS
  ) {
    submitToolOutput(dataChannel, callId, { ok: true, played: phrase, deduped: true });
    return;
  }

  ensureTutorMuted(tutorAudio, muteState);

  try {
    phraseHandlers.onPracticePhraseStart?.(phrase);
    await playPracticePhrase(phrase, tutorAudio);
    rememberPlayedPhrase({ text: normalized, at: Date.now() });
    phraseHandlers.onPracticePhraseEnd?.(phrase);
    submitToolOutput(dataChannel, callId, { ok: true, played: phrase });
  } catch (err) {
    phraseHandlers.onPracticePhraseEnd?.(phrase);
    const message =
      err instanceof Error ? err.message : "Practice phrase playback failed.";
    onError(message);
    submitToolOutput(dataChannel, callId, { ok: false, error: message });
  } finally {
    releaseTutorMute(tutorAudio, muteState);
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
): () => void {
  const handledCallIds = new Set<string>();
  const handledItemIds = new Set<string>();
  const muteState: TutorMuteState = { savedVolume: 1, depth: 0 };
  let lastPlayedPhrase: { text: string; at: number } | null = null;
  let phrasePlaybackChain: Promise<void> = Promise.resolve();

  const onMessage = (messageEvent: MessageEvent) => {
    try {
      const event = JSON.parse(String(messageEvent.data)) as RealtimeEvent;

      // Mute OpenAI stream as soon as a native phrase tool call starts (parallel audio
      // on the same response was causing "double Dutch" with ElevenLabs).
      if (
        (event.type === "response.function_call_arguments.delta" ||
          event.type === "response.output_item.added") &&
        isNativePhraseToolEvent(event)
      ) {
        ensureTutorMuted(tutorAudio, muteState);
      }

      const calls = extractFunctionCalls(event);

      for (const call of calls) {
        phrasePlaybackChain = phrasePlaybackChain.then(() =>
          handleFunctionCall(
            dataChannel,
            tutorAudio,
            muteState,
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
    muteState.depth = 0;
    tutorAudio.volume = muteState.savedVolume;
  };
}
