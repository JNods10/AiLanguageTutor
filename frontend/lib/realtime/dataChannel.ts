import { playPracticePhrase } from "./practicePhrase";

const SPEAK_PRACTICE_PHRASE = "speak_practice_phrase";

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

  sendEvent(dataChannel, { type: "response.cancel" });
  const previousVolume = tutorAudio.volume;
  tutorAudio.volume = 0;

  try {
    phraseHandlers.onPracticePhraseStart?.(phrase);
    await playPracticePhrase(phrase, tutorAudio);
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
  const calls: Array<{ name: string; callId: string; arguments: string }> = [];

  if (event.type === "response.function_call_arguments.done") {
    if (event.name && event.call_id && event.arguments) {
      calls.push({
        name: event.name,
        callId: event.call_id,
        arguments: event.arguments,
      });
    }
    return calls;
  }

  if (event.type === "response.done" && event.response?.output) {
    for (const item of event.response.output) {
      if (
        item.type === "function_call" &&
        item.name &&
        item.call_id &&
        item.arguments
      ) {
        calls.push({
          name: item.name,
          callId: item.call_id,
          arguments: item.arguments,
        });
      }
    }
  }

  return calls;
}

export function attachRealtimeDataChannelHandler(
  dataChannel: RTCDataChannel,
  tutorAudio: HTMLAudioElement,
  onError: (message: string) => void,
  phraseHandlers: PracticePhraseHandlers = {},
): () => void {
  const handledCallIds = new Set<string>();

  const onMessage = (messageEvent: MessageEvent) => {
    try {
      const event = JSON.parse(String(messageEvent.data)) as RealtimeEvent;
      const calls = extractFunctionCalls(event);

      for (const call of calls) {
        void handleFunctionCall(
          dataChannel,
          tutorAudio,
          call.name,
          call.callId,
          call.arguments,
          handledCallIds,
          onError,
          phraseHandlers,
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
