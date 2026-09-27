"use client";

import type { PartialOptions } from "@elevenlabs/client";
import {
  useConversationControls,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { useCallback, useState } from "react";

import { createAgentConversation } from "@/lib/elevenlabs/createConversation";
import type {
  AgentSessionParams,
  ElevenLabsVoiceStatus,
} from "@/lib/elevenlabs/types";
import { STORAGE_KEYS } from "@/lib/constants/app";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";

export function useElevenLabsVoice(params: AgentSessionParams) {
  const { startSession, endSession } = useConversationControls();
  const { status: sdkStatus } = useConversationStatus();
  const { isSpeaking } = useConversationMode();

  const [error, setError] = useState<string | null>(null);
  const [showCaptions, setShowCaptions] = useLocalStorage<boolean>(
    STORAGE_KEYS.voiceShowDutchCaptions,
    true,
  );

  const status: ElevenLabsVoiceStatus =
    error !== null
      ? "error"
      : sdkStatus === "connected"
        ? "connected"
        : sdkStatus === "connecting"
          ? "connecting"
          : "idle";

  const connect = useCallback(async () => {
    if (sdkStatus === "connected" || sdkStatus === "connecting") {
      return;
    }

    setError(null);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const session = await createAgentConversation(params);

      await startSession({
        conversationToken: session.conversationToken,
        overrides: session.overrides as PartialOptions["overrides"],
        dynamicVariables: session.dynamicVariables,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start voice session.",
      );
    }
  }, [params, sdkStatus, startSession]);

  const disconnect = useCallback(async () => {
    setError(null);
    try {
      await endSession();
    } catch {
      // Session may already be closed.
    }
  }, [endSession]);

  return {
    status,
    error,
    connect,
    disconnect,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    isSpeaking,
    showCaptions,
    setShowCaptions,
  };
}
