"use client";

import { createContext, useCallback, useContext } from "react";
import { STORAGE_KEYS } from "@/lib/constants/app";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import {
  DEFAULT_LANGUAGE_CODE,
  getLanguageByCode,
  type Language,
} from "@/lib/languages";

type LanguageContextValue = {
  language: Language;
  setLanguageCode: (code: string) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [storedCode, setStoredCode, hydrated] = useLocalStorage<string>(
    STORAGE_KEYS.language,
    DEFAULT_LANGUAGE_CODE,
  );

  const language = getLanguageByCode(storedCode);

  const setLanguageCode = useCallback(
    (code: string) => {
      setStoredCode(getLanguageByCode(code).code);
    },
    [setStoredCode],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguageCode }}>
      <div className={hydrated ? undefined : "invisible"} aria-busy={!hydrated}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
