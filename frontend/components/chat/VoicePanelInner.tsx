"use client";

import { useLanguage } from "@/lib/context/LanguageContext";
import { useLevel } from "@/lib/context/LevelContext";
import { useElevenLabsVoice } from "@/lib/hooks/useElevenLabsVoice";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MicIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import DutchPhraseCaptions from "./DutchPhraseCaptions";

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

type VoicePanelInnerProps = {
  transcriptLines: string[];
  onSessionStart: () => void;
};

export default function VoicePanelInner({
  transcriptLines,
  onSessionStart,
}: VoicePanelInnerProps) {
  const { language } = useLanguage();
  const { level, levelInfo } = useLevel();
  const {
    status,
    error,
    connect,
    disconnect,
    isConnected,
    isConnecting,
    isSpeaking,
    showCaptions,
    setShowCaptions,
  } = useElevenLabsVoice({
    targetLanguage: language.code,
    explanationLanguage: "en",
    level,
  });

  async function handleMicClick() {
    if (isConnected) {
      await disconnect();
      return;
    }

    onSessionStart();
    await connect();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
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
                isConnected && (isSpeaking || i % 3 === 0)
                  ? "animate-pulse bg-foreground/70"
                  : isConnected
                    ? "bg-foreground/30"
                    : "bg-border",
              )}
              style={{ height: `${8 + (i % 5) * 6}px` }}
            />
          ))}
        </div>

        {isConnected && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowCaptions(!showCaptions)}
              aria-pressed={showCaptions}
            >
              {showCaptions ? "Hide transcript" : "Show transcript"}
            </Button>

            <DutchPhraseCaptions
              languageName={language.name}
              activePhrase={null}
              history={transcriptLines}
              visible={showCaptions}
            />
          </>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Voice practice</h2>
          <p className="text-sm leading-relaxed text-text-muted">
            {isConnected
              ? `Live conversation with your ${language.name} tutor powered by ElevenLabs.`
              : `${levelInfo.summary}. Start a voice session when you're ready.`}
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
            onClick={() => {
              onSessionStart();
              void connect();
            }}
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
