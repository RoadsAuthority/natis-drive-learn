import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitEyeTest } from "@/lib/natisApi";

function randomLetters(count: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from({ length: count })
    .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
    .join("");
}

export default function EyeTest() {
  const navigate = useNavigate();
  const [entry, setEntry] = useState("");
  const [doctorLetter, setDoctorLetter] = useState<File | null>(null);
  const target = useMemo(() => randomLetters(5), []);

  const markStatus = async (status: "passed" | "uploaded", doctorLetterFile?: File | null) => {
    await submitEyeTest(status, doctorLetterFile);
    localStorage.setItem("eyeTestStatus", status);
  };

  const submitSimulation = async () => {
    if (entry.trim().toUpperCase() !== target) {
      toast.error("Letters did not match. Try again or upload doctor letter.");
      return;
    }
    await markStatus("passed");
    toast.success("Eye simulation passed.");
    navigate("/booking");
  };

  const submitDoctorLetter = async () => {
    if (!doctorLetter) {
      toast.error("Please upload doctor letter first.");
      return;
    }
    await markStatus("uploaded", doctorLetter);
    toast.success("Doctor letter submitted.");
    navigate("/booking");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6 space-y-4">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Eye className="h-5 w-5" /> Eye Test</h1>
          <p className="text-sm text-muted-foreground">Read and enter the small letters exactly as shown.</p>
          <div className="border rounded-md p-4 text-center tracking-[0.6em] text-xs md:text-sm font-bold">
            {target}
          </div>
          <Input value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="Enter letters shown" />
          <Button onClick={submitSimulation} className="w-full">Submit Eye Simulation</Button>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="font-semibold">Alternative: Upload doctor eye-scan letter</h2>
          <Label htmlFor="doctor-letter">Doctor letter</Label>
          <Input id="doctor-letter" type="file" onChange={(e) => setDoctorLetter(e.target.files?.[0] ?? null)} />
          <Button variant="outline" onClick={submitDoctorLetter} className="w-full">
            <Upload className="mr-2 h-4 w-4" /> Submit Doctor Letter
          </Button>
        </Card>
      </div>
    </div>
  );
}

