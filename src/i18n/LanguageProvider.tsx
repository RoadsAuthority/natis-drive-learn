import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { af } from "./af";
import { en } from "./en";
import { LANGUAGE_STORAGE_KEY, LANGUAGES, isLanguageCode, languageByCode, type LanguageCode } from "./languages";

type Vars = Record<string, string | number>;

function lookup(source: unknown, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);
  return typeof value === "string" ? value : undefined;
}

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (vars[key] == null ? `{${key}}` : String(vars[key])));
}

type LanguageContextValue = {
  language: LanguageCode;
  locale: string;
  translated: boolean;
  usingFallback: boolean;
  languages: typeof LANGUAGES;
  setLanguage: (code: LanguageCode) => void;
  t: (path: string, vars?: Vars) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguageCode(stored) && languageByCode(stored).translated ? stored : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(readStoredLanguage);

  const setLanguage = useCallback((code: LanguageCode) => {
    if (!languageByCode(code).translated) return;
    setLanguageState(code);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  }, []);

  const meta = languageByCode(language);
  const messages = meta.translated && language === "af" ? af : en;
  const locale = meta.translated && language === "af" ? "af-ZA" : "en-NA";

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (path: string, vars?: Vars) => interpolate(lookup(messages, path) ?? lookup(en, path) ?? path, vars),
    [messages],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale,
      translated: meta.translated,
      usingFallback: !meta.translated,
      languages: LANGUAGES,
      setLanguage,
      t,
    }),
    [language, locale, meta.translated, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
