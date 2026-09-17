"use client";

import { useLanguage } from "@/lib/context/LanguageContext";

export default function LanguageBadge() {
  const { language } = useLanguage();

  return (
    <div className="flex items-center gap-2 text-sm text-text-muted">
      <span aria-hidden>{language.flag}</span>
      <span>{language.name}</span>
    </div>
  );
}
