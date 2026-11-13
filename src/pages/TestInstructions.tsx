import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertCircle, Camera, CheckCircle2, Clock, FileText } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

type Step = "instructions" | "consent" | "ready";

const TestInstructions = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("instructions");
  const [agreed, setAgreed] = useState(false);
  const [monitoringConsent, setMonitoringConsent] = useState(false);

  const handleStartTest = async () => {
    if (!agreed || !monitoringConsent) {
      toast.error(t("instructions.needConsent"));
      return;
    }
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen is best-effort; tab visibility is still monitored.
    }
    sessionStorage.setItem("natis-proctoring-consent", "true");
    navigate("/test");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t("instructions.title")}</h1>
          </div>

          {step === "instructions" ? (
            <>
              <p className="text-lg text-muted-foreground mb-8">{t("instructions.intro")}</p>
              <div className="space-y-6 mb-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    {t("instructions.guidelines")}
                  </h2>
                  <ul className="space-y-3 ml-7">
                    <li>
                      {t("instructions.q1")}
                    </li>
                    <li>
                      {t("instructions.q2")}
                    </li>
                    <li>
                      {t("instructions.q3")}
                    </li>
                    <li>
                      {t("instructions.q4")}
                    </li>
                    <li>
                      {t("instructions.q5")}
                    </li>
                    <li>
                      {t("instructions.q6")}
                    </li>
                  </ul>
                </div>
                <div className="bg-accent/30 border border-accent-foreground/20 rounded-lg p-4 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-sm">
                    <strong>{t("instructions.tip")}</strong> {t("instructions.tipBody")}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-6 p-4 bg-muted rounded-lg">
                <Checkbox id="agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                <label htmlFor="agree" className="text-sm font-medium cursor-pointer">
                  {t("instructions.agree")}
                </label>
              </div>
              <Button onClick={() => setStep("consent")} size="lg" className="w-full text-lg" disabled={!agreed}>
                {t("instructions.toConsent")}
              </Button>
            </>
          ) : null}

          {step === "consent" ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                {t("instructions.consentTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("instructions.consentBody")}
              </p>
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Checkbox
                  id="monitoring-consent"
                  checked={monitoringConsent}
                  onCheckedChange={(checked) => setMonitoringConsent(checked === true)}
                />
                <label htmlFor="monitoring-consent" className="text-sm font-medium cursor-pointer">
                  {t("instructions.consentCheck")}
                </label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("instructions")}>
                  {t("instructions.back")}
                </Button>
                <Button onClick={() => setStep("ready")} disabled={!monitoringConsent}>
                  {t("instructions.continue")}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "ready" ? (
            <div className="space-y-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <p className="text-lg">{t("instructions.ready")}</p>
              <Button onClick={() => void handleStartTest()} size="lg" className="w-full text-lg">
                {t("instructions.start")}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default TestInstructions;
