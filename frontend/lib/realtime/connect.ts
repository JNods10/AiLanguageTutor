import { apiConfig } from "@/lib/config";

import type { CreateSessionResponse, SessionParams } from "./types";

const OPENAI_REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((item) =>
          typeof item === "object" && item && "msg" in item
            ? String(item.msg)
            : null,
        )
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }
  } catch {
    // Response body was not JSON.
  }

  return `Request failed (${response.status})`;
}

export async function createRealtimeSession(
  params: SessionParams,
): Promise<CreateSessionResponse> {
  const response = await fetch(`${apiConfig.baseUrl}/api/realtime/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetLanguage: params.targetLanguage,
      explanationLanguage: params.explanationLanguage ?? "en",
      level: params.level ?? "beginner",
      scenario: params.scenario ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<CreateSessionResponse>;
}

export type RealtimeConnection = {
  peerConnection: RTCPeerConnection;
  mediaStream: MediaStream;
  audioElement: HTMLAudioElement;
  dataChannel: RTCDataChannel;
  close: () => void;
};

export async function connectRealtimeVoice(
  clientSecret: string,
): Promise<RealtimeConnection> {
  const peerConnection = new RTCPeerConnection();
  const audioElement = document.createElement("audio");
  audioElement.autoplay = true;

  peerConnection.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) {
      audioElement.srcObject = stream;
    }
  };

  const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  for (const track of mediaStream.getTracks()) {
    peerConnection.addTrack(track, mediaStream);
  }

  const dataChannel = peerConnection.createDataChannel("oai-events");

  await peerConnection.setLocalDescription(await peerConnection.createOffer());

  const localDescription = peerConnection.localDescription;
  if (!localDescription?.sdp) {
    mediaStream.getTracks().forEach((track) => track.stop());
    peerConnection.close();
    throw new Error("Could not create a WebRTC offer.");
  }

  const sdpResponse = await fetch(OPENAI_REALTIME_CALLS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      "Content-Type": "application/sdp",
    },
    body: localDescription.sdp,
  });

  if (!sdpResponse.ok) {
    mediaStream.getTracks().forEach((track) => track.stop());
    peerConnection.close();
    throw new Error(await readErrorMessage(sdpResponse));
  }

  await peerConnection.setRemoteDescription({
    type: "answer",
    sdp: await sdpResponse.text(),
  });

  return {
    peerConnection,
    mediaStream,
    audioElement,
    dataChannel,
    close: () => {
      dataChannel.close();
      mediaStream.getTracks().forEach((track) => track.stop());
      peerConnection.close();
      audioElement.srcObject = null;
    },
  };
}
