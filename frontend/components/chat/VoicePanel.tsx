"use client";

import { useLanguage } from "@/lib/context/LanguageContext";
import { useLevel } from "@/lib/context/LevelContext";
import { useRealtimeVoice } from "@/lib/hooks/useRealtimeVoice";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MicIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const WAVEFORM_BARS = 24;

function statusLabel(status: string) {
  switch (status) {
    case "connecting":
      return "Connecting…";
    case "connected":
      return "Connected";
    case "error":
      return "Error";
    default:
      return "Not connected";
  }
}

export default function VoicePanel() {
  const { language } = useLanguage();
  const { level, levelInfo } = useLevel();
  const { status, error, connect, disconnect, isConnected, isConnecting } =
    useRealtimeVoice({
      targetLanguage: language.code,
      explanationLanguage: "en",
      level,
    });

  async function handleMicClick() {
    if (isConnected) {
      disconnect();
      return;
    }

    await connect();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <Badge
          className={cn(
            isConnected && "bg-foreground text-background",
            status === "error" && "text-foreground",
          )}
        >
          {statusLabel(status)}
        </Badge>

        <button
          type="button"
          onClick={handleMicClick}
          disabled={isConnecting}
          aria-label={isConnected ? "End voice session" : "Start voice session"}
          className={cn(
            "flex h-24 w-24 items-center justify-center rounded-full border-2 transition-colors",
            isConnected
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-surface text-text-muted hover:border-foreground hover:text-foreground",
            isConnecting && "opacity-60",
          )}
        >
          <MicIcon size={32} strokeWidth={1.5} />
        </button>

        <div
          className="flex h-12 w-full max-w-xs items-end justify-center gap-1"
          aria-hidden
        >
          {Array.from({ length: WAVEFORM_BARS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full transition-colors",
                isConnected
                  ? "animate-pulse bg-foreground/70"
                  : "bg-border",
              )}
              style={{ height: `${8 + (i % 5) * 6}px` }}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Voice practice</h2>
          <p className="text-sm leading-relaxed text-text-muted">
            {isConnected
              ? `English tutoring with native ${language.name} phrases via ElevenLabs when the tutor models language.`
              : `Start a live voice session in ${language.name}. Explanations are in English; modeled phrases use native TTS when configured.`}
              ? `Speak naturally in ${language.name}. Your tutor will respond with corrections and follow-up questions.`
              : `${levelInfo.summary}. Start a live voice session in ${language.name}.`}
          </p>
          {isConnected && (
            <p className="text-xs text-text-muted">
              End the session to change practice level in the sidebar.
            </p>
          )}
        </div>

        {!isConnected ? (
          <Button
            variant="primary"
            size="lg"
            onClick={connect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting…" : "Start talking"}
          </Button>
        ) : (
          <Button variant="secondary" size="lg" onClick={disconnect}>
            End conversation
          </Button>
        )}

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
