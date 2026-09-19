"use client";

import { cn } from "@/lib/utils/cn";

type DutchPhraseCaptionsProps = {
  languageName: string;
  activePhrase: string | null;
  history: string[];
  visible: boolean;
};

export default function DutchPhraseCaptions({
  languageName,
  activePhrase,
  history,
  visible,
}: DutchPhraseCaptionsProps) {
  if (!visible) {
    return null;
  }

  const hasContent = Boolean(activePhrase) || history.length > 0;

  return (
    <div
      className="w-full rounded-lg border border-border bg-surface-muted px-4 py-3 text-left"
      aria-live="polite"
      aria-atomic="false"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {languageName} you&apos;re hearing
      </p>

      {!hasContent ? (
        <p className="mt-2 text-sm text-text-muted">
          Modeled {languageName} phrases will appear here while you listen.
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {activePhrase && (
            <p className="text-lg font-medium leading-snug text-foreground">
              {activePhrase}
            </p>
          )}

          {history.length > 0 && (
            <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto text-sm text-text-muted">
              {[...history].reverse().map((phrase, index) => (
                <li
                  key={`${phrase}-${index}`}
                  className={cn(
                    phrase === activePhrase && "font-medium text-foreground",
                  )}
                >
                  {phrase}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
