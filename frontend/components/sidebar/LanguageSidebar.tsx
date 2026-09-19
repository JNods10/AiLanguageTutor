"use client";

import { LANGUAGES } from "@/lib/languages";
import { PRACTICE_LEVELS } from "@/lib/levels";
import { useLanguage } from "@/lib/context/LanguageContext";
import { useLevel } from "@/lib/context/LevelContext";
import BrandLogo from "@/components/ui/BrandLogo";
import SectionLabel from "@/components/ui/SectionLabel";
import LanguageItem from "./LanguageItem";
import LevelItem from "./LevelItem";

export default function LanguageSidebar() {
  const { language, setLanguageCode } = useLanguage();
  const { level, setLevel } = useLevel();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-5">
        <BrandLogo />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <SectionLabel className="mb-3 px-1">Language</SectionLabel>
        <nav className="flex flex-col gap-1" aria-label="Target language">
          {LANGUAGES.map((lang) => (
            <LanguageItem
              key={lang.code}
              language={lang}
              isActive={lang.code === language.code}
              onSelect={setLanguageCode}
            />
          ))}
        </nav>

        <SectionLabel className="mb-3 mt-8 px-1">Practice level</SectionLabel>
        <p className="mb-2 px-1 text-xs leading-relaxed text-text-muted">
          Controls how much Dutch the tutor uses and how complex the
          conversation is. Applies when you start a new voice session.
        </p>
        <nav className="flex flex-col gap-1" aria-label="Practice level">
          {PRACTICE_LEVELS.map((item) => (
            <LevelItem
              key={item.id}
              level={item}
              isActive={item.id === level}
              onSelect={setLevel}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
