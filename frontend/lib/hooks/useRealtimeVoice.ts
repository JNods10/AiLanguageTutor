"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { STORAGE_KEYS } from "@/lib/constants/app";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import {
  connectRealtimeVoice,
  createRealtimeSession,
  type RealtimeConnection,
} from "@/lib/realtime/connect";
import type { ConversationMode } from "@/lib/realtime/dataChannel";
import { resetTurnDiagnostics } from "@/lib/realtime/turnDiagnostics";
import type { LanguageLevel, VoiceConnectionStatus } from "@/lib/realtime/types";

const CONVERSATION_MODE_LABELS: Record<ConversationMode, string> = {
  free_chat: "Free chat",
  structured_lesson: "Structured lesson",
  explain_focus: "English explanations",
};

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
  const [activePracticePhrase, setActivePracticePhrase] = useState<string | null>(
    null,
  );
  const [practicePhraseHistory, setPracticePhraseHistory] = useState<string[]>(
    [],
  );
  const [showDutchCaptions, setShowDutchCaptions] = useLocalStorage<boolean>(
    STORAGE_KEYS.voiceShowDutchCaptions,
    true,
  );
  const [conversationMode, setConversationMode] =
    useState<ConversationMode | null>(null);
  const [conversationModeNote, setConversationModeNote] = useState<string | null>(
    null,
  );
  const connectionRef = useRef<RealtimeConnection | null>(null);

  const resetPracticePhrases = useCallback(() => {
    setActivePracticePhrase(null);
    setPracticePhraseHistory([]);
    setConversationMode(null);
    setConversationModeNote(null);
    resetTurnDiagnostics();
  }, []);

  const disconnect = useCallback(() => {
    connectionRef.current?.close();
    connectionRef.current = null;
    setStatus("idle");
    setError(null);
    resetPracticePhrases();
  }, [resetPracticePhrases]);

  const connect = useCallback(async () => {
    if (connectionRef.current) {
      return;
    }

    setStatus("connecting");
    setError(null);
    resetPracticePhrases();

    try {
      const session = await createRealtimeSession({
        targetLanguage,
        explanationLanguage,
        level,
      });

      const connection = await connectRealtimeVoice(session.clientSecret, {
        onToolError: (message) => setError(message),
        onPracticePhraseStart: (phrase) => setActivePracticePhrase(phrase),
        onPracticePhraseEnd: (phrase) => {
          setActivePracticePhrase(null);
          setPracticePhraseHistory((prev) => {
            if (prev[prev.length - 1] === phrase) {
              return prev;
            }
            return [...prev, phrase];
          });
        },
        onConversationModeChange: (mode, note) => {
          setConversationMode(mode);
          setConversationModeNote(note ?? null);
        },
      });
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
          resetPracticePhrases();
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
      resetPracticePhrases();
    }
  }, [
    targetLanguage,
    explanationLanguage,
    level,
    resetPracticePhrases,
  ]);

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
    activePracticePhrase,
    practicePhraseHistory,
    showDutchCaptions,
    setShowDutchCaptions,
    conversationMode,
    conversationModeLabel: conversationMode
      ? CONVERSATION_MODE_LABELS[conversationMode]
      : null,
    conversationModeNote,
  };
}
