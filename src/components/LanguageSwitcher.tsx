import { Globe } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { LanguageCode } from "@/i18n/languages";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, languages, setLanguage, t } = useLanguage();

  return (
    <label className={`inline-flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <Globe className="h-4 w-4 shrink-0" aria-hidden />
      <span className="sr-only">{t("language.switch")}</span>
      <select
        aria-label={t("language.switch")}
        className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
        value={language}
        onChange={(event) => setLanguage(event.target.value as LanguageCode)}
      >
        {languages.filter((item) => item.translated).map((item) => (
          <option key={item.code} value={item.code}>
            {item.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
