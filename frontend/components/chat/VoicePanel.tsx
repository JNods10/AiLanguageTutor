"use client";

import { useLanguage } from "@/lib/context/LanguageContext";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MicIcon } from "@/components/ui/icons";

const WAVEFORM_BARS = 24;

export default function VoicePanel() {
  const { language } = useLanguage();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <Badge>Not connected</Badge>

        <button
          type="button"
          disabled
          aria-label="Start voice session"
          className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-border bg-surface text-text-muted opacity-60"
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
              className="w-1 rounded-full bg-border"
              style={{ height: `${8 + (i % 5) * 6}px` }}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Voice practice</h2>
          <p className="text-sm leading-relaxed text-text-muted">
            Speak naturally in {language.name} with your AI tutor. Voice
            sessions require a backend connection and will be available once
            the realtime API is wired up.
          </p>
        </div>

        <Button variant="secondary" size="lg" disabled>
          Connect (coming soon)
        </Button>
      </div>
    </div>
  );
}
