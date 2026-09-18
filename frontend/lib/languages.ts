export type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

export const LANGUAGES: Language[] = [
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "zh", name: "Mandarin", nativeName: "中文", flag: "🇨🇳" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
];

export const DEFAULT_LANGUAGE_CODE = "es";

export function getLanguageByCode(code: string): Language {
  return (
    LANGUAGES.find((lang) => lang.code === code) ??
    LANGUAGES.find((lang) => lang.code === DEFAULT_LANGUAGE_CODE)!
  );
}
