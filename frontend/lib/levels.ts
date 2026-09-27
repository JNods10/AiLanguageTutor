export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

/** @deprecated OpenAI Realtime path only — map from CEFR at call time. */
export type OpenAiPracticeLevel = "beginner" | "intermediate" | "advanced";

export type PracticeLevel = {
  id: CefrLevel;
  name: string;
  summary: string;
};

export const PRACTICE_LEVELS: PracticeLevel[] = [
  {
    id: "A1",
    name: "A1 · Beginner",
    summary: "Simple Dutch · slow, clear speech",
  },
  {
    id: "A2",
    name: "A2 · Elementary",
    summary: "Everyday chat · more vocabulary",
  },
  {
    id: "B1",
    name: "B1 · Intermediate",
    summary: "Natural conversation · light corrections",
  },
  {
    id: "B2",
    name: "B2 · Upper intermediate",
    summary: "Nuanced Dutch · idioms & opinions",
  },
  {
    id: "C1",
    name: "C1 · Advanced",
    summary: "Fluent dialogue · subtle refinements",
  },
];

export const DEFAULT_LEVEL: CefrLevel = "A1";

const LEGACY_LEVEL_MAP: Record<string, CefrLevel> = {
  beginner: "A1",
  intermediate: "B1",
  advanced: "C1",
};

const CEFR_IDS = new Set<CefrLevel>(PRACTICE_LEVELS.map((level) => level.id));

export function normalizeCefrLevel(id: string): CefrLevel {
  const mapped = LEGACY_LEVEL_MAP[id] ?? id;
  if (CEFR_IDS.has(mapped as CefrLevel)) {
    return mapped as CefrLevel;
  }
  return DEFAULT_LEVEL;
}

export function getLevelById(id: string): PracticeLevel {
  const normalized = normalizeCefrLevel(id);
  return (
    PRACTICE_LEVELS.find((level) => level.id === normalized) ??
    PRACTICE_LEVELS.find((level) => level.id === DEFAULT_LEVEL)!
  );
}

export function cefrToOpenAiLevel(cefr: CefrLevel): OpenAiPracticeLevel {
  switch (cefr) {
    case "A1":
    case "A2":
      return "beginner";
    case "B1":
    case "B2":
      return "intermediate";
    case "C1":
      return "advanced";
  }
}
