"use client";

import { createContext, useCallback, useContext } from "react";

import { STORAGE_KEYS } from "@/lib/constants/app";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import type { CefrLevel } from "@/lib/levels";
import { DEFAULT_LEVEL, getLevelById } from "@/lib/levels";

type LevelContextValue = {
  level: CefrLevel;
  setLevel: (level: CefrLevel) => void;
  levelInfo: ReturnType<typeof getLevelById>;
};

const LevelContext = createContext<LevelContextValue | null>(null);

export function LevelProvider({ children }: { children: React.ReactNode }) {
  const [storedLevel, setStoredLevel, hydrated] = useLocalStorage<string>(
    STORAGE_KEYS.level,
    DEFAULT_LEVEL,
  );

  const levelInfo = getLevelById(storedLevel);
  const level = levelInfo.id;

  const setLevel = useCallback(
    (next: CefrLevel) => {
      setStoredLevel(getLevelById(next).id);
    },
    [setStoredLevel],
  );

  return (
    <LevelContext.Provider value={{ level, setLevel, levelInfo }}>
      <div className={hydrated ? undefined : "invisible"} aria-busy={!hydrated}>
        {children}
      </div>
    </LevelContext.Provider>
  );
}

export function useLevel() {
  const ctx = useContext(LevelContext);
  if (!ctx) {
    throw new Error("useLevel must be used within LevelProvider");
  }
  return ctx;
}
