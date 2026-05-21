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

export default function EyeTest() {
  const navigate = useNavigate();
  const { refresh } = useAuthContext();
  const [doctorLetter, setDoctorLetter] = useState<File | null>(null);
  const [screening, setScreening] = useState(false);

  const markStatus = async (status: "passed" | "uploaded", doctorLetterFile?: File | null) => {
    await submitEyeTest(status, doctorLetterFile);
    localStorage.setItem("eyeTestStatus", status);
  };

  const submitDoctorLetter = async () => {
    if (!doctorLetter) {
      toast.error("Please upload doctor letter first.");
      return;
    }
    await markStatus("uploaded", doctorLetter);
    await refresh();
    toast.success("Doctor letter submitted.");
    navigate("/portal");
  };

  const handleScreeningComplete = async (passed: boolean) => {
    if (!passed) {
      toast.error("Vision screening was not passed. Try again or upload a doctor letter.");
      setScreening(false);
      return;
    }
    await markStatus("passed");
    await refresh();
    toast.success("Vision screening passed.");
    navigate("/portal");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6 space-y-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-5 w-5" /> Vision screening
          </h1>
          <p className="text-sm text-muted-foreground">
            Read each Snellen-style line within five seconds. Lines get smaller as you progress.
          </p>
          {screening ? (
            <SnellenScreening
              lineCount={5}
              secondsPerLine={5}
              passThreshold={0.8}
              onComplete={(passed) => void handleScreeningComplete(passed)}
              onCancel={() => setScreening(false)}
            />
          ) : (
            <Button onClick={() => setScreening(true)} className="w-full">
              Start vision screening
            </Button>
          )}
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="font-semibold">Alternative: Upload doctor eye-scan letter</h2>
          <Label htmlFor="doctor-letter">Doctor letter</Label>
          <Input id="doctor-letter" type="file" onChange={(e) => setDoctorLetter(e.target.files?.[0] ?? null)} />
          <Button variant="outline" onClick={() => void submitDoctorLetter()} className="w-full">
            <Upload className="mr-2 h-4 w-4" /> Submit doctor letter
          </Button>
        </Card>
      </div>
    </div>
  );
}
