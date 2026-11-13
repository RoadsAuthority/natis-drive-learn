import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SnellenScreening from "@/components/vision/SnellenScreening";
import { submitEyeTest } from "@/lib/natisApi";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function EyeTest() {
  const navigate = useNavigate();
  const { refresh } = useAuthContext();
  const { t } = useLanguage();
  const [doctorLetter, setDoctorLetter] = useState<File | null>(null);
  const [screening, setScreening] = useState(false);

  const markStatus = async (status: "passed" | "uploaded", doctorLetterFile?: File | null) => {
    await submitEyeTest(status, doctorLetterFile);
    localStorage.setItem("eyeTestStatus", status);
  };

  const submitDoctorLetter = async () => {
    if (!doctorLetter) {
      toast.error(t("eye.needLetter"));
      return;
    }
    await markStatus("uploaded", doctorLetter);
    await refresh();
    toast.success(t("eye.letterSubmitted"));
    navigate("/portal");
  };

  const handleScreeningComplete = async (passed: boolean) => {
    if (!passed) {
      toast.error(t("eye.notPassed"));
      setScreening(false);
      return;
    }
    await markStatus("passed");
    await refresh();
    toast.success(t("eye.passed"));
    navigate("/portal");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6 space-y-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-5 w-5" /> {t("eye.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("eye.intro")}</p>
          {screening ? (
            <SnellenScreening
              lineCount={5}
              secondsPerLine={10}
              passThreshold={0.8}
              onComplete={(passed) => void handleScreeningComplete(passed)}
              onCancel={() => setScreening(false)}
            />
          ) : (
            <Button onClick={() => setScreening(true)} className="w-full">
              {t("eye.start")}
            </Button>
          )}
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="font-semibold">{t("eye.altTitle")}</h2>
          <Label htmlFor="doctor-letter">{t("eye.doctorLetter")}</Label>
          <Input id="doctor-letter" type="file" onChange={(e) => setDoctorLetter(e.target.files?.[0] ?? null)} />
          <Button variant="outline" onClick={() => void submitDoctorLetter()} className="w-full">
            <Upload className="mr-2 h-4 w-4" /> {t("eye.submitLetter")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
