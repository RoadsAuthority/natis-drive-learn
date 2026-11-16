import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, ChevronRight, BookOpen } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { LanguageCode } from "@/i18n/languages";

const LanguageSelection = () => {
  const navigate = useNavigate();
  const { language, languages, setLanguage, usingFallback, t } = useLanguage();
  const selected = languages.find((item) => item.code === language);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground ring-4 ring-destructive/20 mb-4">
            <Globe className="w-10 h-10" />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">{t("language.welcome")}</h1>
          <p className="text-lg text-muted-foreground">{t("language.tagline")}</p>
        </div>

        <Card className="border-t-4 border-t-destructive p-5 shadow-lg sm:p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">{t("language.heading")}</h2>

          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code as LanguageCode)}
                disabled={!lang.translated}
                aria-pressed={language === lang.code}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left disabled:cursor-not-allowed disabled:opacity-60 ${
                  language === lang.code
                    ? "border-secondary bg-secondary text-secondary-foreground shadow-sm"
                    : lang.translated
                      ? "border-border hover:border-secondary/60 hover:bg-secondary/5 bg-card"
                      : "border-border bg-muted/40"
                }`}
              >
                <span className="text-lg font-medium">{lang.nativeName}</span>
                {lang.translated ? null : (
                  <span className="mt-1 block text-sm text-muted-foreground">{t("language.comingSoon")}</span>
                )}
              </button>
            ))}
          </div>

          {usingFallback && selected ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("language.pending", { language: selected.nativeName })}</p>
          ) : null}

          <Button onClick={() => navigate("/login")} size="lg" className="w-full mt-8 text-lg">
            {t("language.continue")}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full mt-3 text-lg border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => navigate("/study")}
          >
            <BookOpen className="mr-2 h-5 w-5" />
            {t("language.study")}
          </Button>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">{t("language.footer")}</p>
      </div>
    </div>
  );
};

export default LanguageSelection;
