"use client";

import type { Language } from "@/lib/languages";
import { cn } from "@/lib/utils/cn";

type LanguageItemProps = {
  language: Language;
  isActive: boolean;
  onSelect: (code: string) => void;
};

export default function LanguageItem({
  language,
  isActive,
  onSelect,
}: LanguageItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(language.code)}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        isActive
          ? "border border-border bg-surface-muted"
          : "border border-transparent hover:bg-surface-muted",
      )}
    >
      <span className="text-base leading-none" aria-hidden>
        {language.flag}
      </span>
      <span className="flex flex-col">
        <span className="font-medium text-foreground">{language.name}</span>
        <span className="text-xs text-text-muted">{language.nativeName}</span>
      </span>
    </button>
  );
}
