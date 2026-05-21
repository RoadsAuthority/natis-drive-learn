import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, ChevronRight, BookOpen } from "lucide-react";

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "om", name: "Oshiwambo", nativeName: "Oshiwambo" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
  { code: "hz", name: "Otjiherero", nativeName: "Otjiherero" },
  { code: "kw", name: "Rukwangali", nativeName: "Rukwangali" },
];

const LanguageSelection = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const navigate = useNavigate();

  const handleContinue = () => {
    localStorage.setItem("preferredLanguage", selectedLanguage);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Globe className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Welcome to the Online Learner Licence System
          </h1>
          <p className="text-lg text-muted-foreground">
            Safe roads to prosperity
          </p>
        </div>

        <Card className="p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-center">Language Selection</h2>
          
          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedLanguage === lang.code
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-card"
                }`}
              >
                <span className="text-lg font-medium">{lang.nativeName}</span>
              </button>
            ))}
          </div>

          <Button
            onClick={handleContinue}
            size="lg"
            className="w-full mt-8 text-lg"
          >
            Continue
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full mt-3 text-lg"
            onClick={() => navigate("/study")}
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Study materials (PDFs)
          </Button>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2025 Learner Licence Portal — assignment prototype
        </p>
      </div>
    </div>
  );
};

export default LanguageSelection;
