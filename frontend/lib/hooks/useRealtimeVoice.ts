"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  connectRealtimeVoice,
  createRealtimeSession,
  type RealtimeConnection,
} from "@/lib/realtime/connect";
import type { LanguageLevel, VoiceConnectionStatus } from "@/lib/realtime/types";

type UseRealtimeVoiceOptions = {
  targetLanguage: string;
  explanationLanguage?: string;
  level?: LanguageLevel;
};

export function useRealtimeVoice({
  targetLanguage,
  explanationLanguage = "en",
  level = "beginner",
}: UseRealtimeVoiceOptions) {
  const [status, setStatus] = useState<VoiceConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<RealtimeConnection | null>(null);

  const disconnect = useCallback(() => {
    connectionRef.current?.close();
    connectionRef.current = null;
    setStatus("idle");
    setError(null);
  }, []);

  const connect = useCallback(async () => {
    if (connectionRef.current) {
      return;
    }

    setStatus("connecting");
    setError(null);

    try {
      const session = await createRealtimeSession({
        targetLanguage,
        explanationLanguage,
        level,
      });

      const connection = await connectRealtimeVoice(session.clientSecret);
      connectionRef.current = connection;

      connection.peerConnection.onconnectionstatechange = () => {
        const state = connection.peerConnection.connectionState;

        if (state === "connected") {
          setStatus("connected");
          return;
        }

        if (state === "failed") {
          connectionRef.current?.close();
          connectionRef.current = null;
          setStatus("error");
          setError("Voice connection failed.");
        }
      };

      setStatus("connected");
    } catch (err) {
      connectionRef.current?.close();
      connectionRef.current = null;
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Could not start voice session.",
      );
    }
  }, [targetLanguage, explanationLanguage, level]);

  useEffect(
    () => () => {
      connectionRef.current?.close();
    },
    [],
  );

  return {
    status,
    error,
    connect,
    disconnect,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
  };
}
