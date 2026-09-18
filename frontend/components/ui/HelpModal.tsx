"use client";

import Overlay from "@/components/ui/Overlay";
import Button from "@/components/ui/Button";

type HelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const HELP_ITEMS = [
  { key: "Enter", description: "send your message" },
  { key: "Shift+Enter", description: "new line" },
  { key: null, description: "Corrections appear inline below tutor replies" },
  { key: null, description: "Switch languages anytime from the sidebar" },
] as const;

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <Overlay
        onClose={onClose}
        className="fixed inset-0 z-50 bg-black/20"
        aria-label="Close help"
      />
      <div
        role="dialog"
        aria-labelledby="help-title"
        className="fixed bottom-20 right-6 z-50 w-80 rounded-xl border border-border bg-background p-5 shadow-lg"
      >
        <h2 id="help-title" className="mb-3 text-sm font-semibold">
          How it works
        </h2>
        <ul className="flex flex-col gap-2 text-sm text-text-muted">
          {HELP_ITEMS.map((item, i) => (
            <li key={i}>
              {item.key ? (
                <>
                  <strong className="font-medium text-foreground">{item.key}</strong>
                  {" — "}
                  {item.description}
                </>
              ) : (
                item.description
              )}
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          size="md"
          onClick={onClose}
          className="mt-4 w-full"
        >
          Got it
        </Button>
      </div>
    </>
  );
}
