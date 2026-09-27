"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { useCallback, useState } from "react";

import VoicePanelInner from "./VoicePanelInner";

export default function VoicePanel() {
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);

  const handleMessage = useCallback(
    (payload: { message: string; role: "user" | "agent" }) => {
      const trimmed = payload.message.trim();
      if (!trimmed) {
        return;
      }
      const role = payload.role === "user" ? "You" : "Tutor";
      const line = `${role}: ${trimmed}`;
      setTranscriptLines((prev) => {
        if (prev[prev.length - 1] === line) {
          return prev;
        }
        return [...prev, line].slice(-30);
      });
    },
    [],
  );

  const clearTranscript = useCallback(() => {
    setTranscriptLines([]);
  }, []);

  return (
    <ConversationProvider
      onMessage={handleMessage}
      onError={(err) => {
        console.error("ElevenLabs conversation error:", err);
      }}
    >
      <VoicePanelInner
        transcriptLines={transcriptLines}
        onSessionStart={clearTranscript}
      />
    </ConversationProvider>
  );
}
