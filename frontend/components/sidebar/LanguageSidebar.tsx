"use client";

import { LANGUAGES } from "@/lib/languages";
import { useLanguage } from "@/lib/context/LanguageContext";
import BrandLogo from "@/components/ui/BrandLogo";
import SectionLabel from "@/components/ui/SectionLabel";
import LanguageItem from "./LanguageItem";

export default function LanguageSidebar() {
  const { language, setLanguageCode } = useLanguage();

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
      </div>
    </div>
  );
}
