"use client";

import type { PracticeLevel } from "@/lib/levels";
import { cn } from "@/lib/utils/cn";

type LevelItemProps = {
  level: PracticeLevel;
  isActive: boolean;
  disabled?: boolean;
  onSelect: (id: PracticeLevel["id"]) => void;
};

export default function LevelItem({
  level,
  isActive,
  disabled,
  onSelect,
}: LevelItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(level.id)}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "flex w-full flex-col rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        isActive
          ? "border border-border bg-surface-muted"
          : "border border-transparent hover:bg-surface-muted",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="font-medium text-foreground">{level.name}</span>
      <span className="text-xs text-text-muted">{level.summary}</span>
    </button>
  );
}
