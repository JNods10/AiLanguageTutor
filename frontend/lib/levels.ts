import type { LanguageLevel } from "@/lib/realtime/types";

export type PracticeLevel = {
  id: LanguageLevel;
  name: string;
  summary: string;
};

export const PRACTICE_LEVELS: PracticeLevel[] = [
  {
    id: "beginner",
    name: "Beginner",
    summary: "Mostly English · simple phrases",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    summary: "Mostly Dutch · everyday conversation",
  },
  {
    id: "advanced",
    name: "Advanced",
    summary: "Dutch-first · complex, natural dialogue",
  },
];

export const DEFAULT_LEVEL: LanguageLevel = "beginner";

export function getLevelById(id: string): PracticeLevel {
  return (
    PRACTICE_LEVELS.find((level) => level.id === id) ??
    PRACTICE_LEVELS.find((level) => level.id === DEFAULT_LEVEL)!
  );
}
