"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { fetchTranslation } from "@/lib/translate/fetchTranslation";
import { cn } from "@/lib/utils/cn";

type DutchPhraseCaptionsProps = {
  languageName: string;
  sourceLanguageCode: string;
  explanationLanguageCode: string;
  explanationLanguageName: string;
  activePhrase: string | null;
  history: string[];
  visible: boolean;
};

type SelectionPopover = {
  selectedText: string;
  left: number;
  top: number;
  translation: string | null;
  loading: boolean;
  error: string | null;
};

function getSelectionInContainer(container: HTMLElement): string | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) {
    return null;
  }

  const text = selection.toString().trim();
  return text.length > 0 ? text : null;
}

function popoverPosition(container: HTMLElement): { left: number; top: number } {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    const rect = container.getBoundingClientRect();
    return { left: rect.left, top: rect.bottom + 8 };
  }

  const rect = selection.getRangeAt(0).getBoundingClientRect();
  const left = Math.min(
    Math.max(rect.left, 12),
    window.innerWidth - 280,
  );
  return { left, top: rect.bottom + 8 };
}

export default function DutchPhraseCaptions({
  languageName,
  sourceLanguageCode,
  explanationLanguageCode,
  explanationLanguageName,
  activePhrase,
  history,
  visible,
}: DutchPhraseCaptionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const requestIdRef = useRef(0);
  const [popover, setPopover] = useState<SelectionPopover | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismissPopover = useCallback(() => {
    setPopover(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const runTranslation = useCallback(
    async (selectedText: string, position: { left: number; top: number }) => {
      const requestId = ++requestIdRef.current;
      setPopover({
        selectedText,
        left: position.left,
        top: position.top,
        translation: null,
        loading: true,
        error: null,
      });

      try {
        const translation = await fetchTranslation({
          text: selectedText,
          sourceLanguage: sourceLanguageCode,
          targetLanguage: explanationLanguageCode,
        });
        if (requestId !== requestIdRef.current) {
          return;
        }
        setPopover((prev) =>
          prev && prev.selectedText === selectedText
            ? { ...prev, loading: false, translation }
            : prev,
        );
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Could not translate selection.";
        setPopover((prev) =>
          prev && prev.selectedText === selectedText
            ? { ...prev, loading: false, error: message }
            : prev,
        );
      }
    },
    [sourceLanguageCode, explanationLanguageCode],
  );

  const handlePointerUp = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const selectedText = getSelectionInContainer(container);
    if (!selectedText) {
      return;
    }

    void runTranslation(selectedText, popoverPosition(container));
  }, [runTranslation]);

  useEffect(() => {
    if (!popover) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismissPopover();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [popover, dismissPopover]);

  if (!visible) {
    return null;
  }

  const hasContent = Boolean(activePhrase) || history.length > 0;

  return (
    <>
      <div
        ref={containerRef}
        className="w-full select-text rounded-lg border border-border bg-surface-muted px-4 py-3 text-left"
        aria-live="polite"
        aria-atomic="false"
        aria-describedby={hintId}
        onPointerUp={handlePointerUp}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {languageName} you&apos;re hearing
        </p>
        <p id={hintId} className="mt-1 text-xs text-text-muted">
          Highlight a word or sentence for {explanationLanguageName} translation.
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

      {mounted &&
        popover &&
        createPortal(
          <div
            className="fixed z-50 w-[min(100vw-24px,260px)] rounded-md border border-border bg-surface px-3 py-2 text-left shadow-md"
            style={{ left: popover.left, top: popover.top }}
            role="status"
            aria-live="polite"
          >
            <p className="text-xs font-medium text-text-muted">
              {explanationLanguageName}
            </p>
            {popover.loading && (
              <p className="mt-1 text-sm text-foreground">Translating…</p>
            )}
            {popover.error && (
              <p className="mt-1 text-sm text-red-600">{popover.error}</p>
            )}
            {popover.translation && (
              <p className="mt-1 text-sm leading-snug text-foreground">
                {popover.translation}
              </p>
            )}
            <button
              type="button"
              className="mt-2 text-xs text-text-muted underline-offset-2 hover:underline"
              onClick={dismissPopover}
            >
              Dismiss
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
