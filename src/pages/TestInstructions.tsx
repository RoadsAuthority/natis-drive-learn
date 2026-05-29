import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertCircle, Camera, CheckCircle2, Clock, FileText } from "lucide-react";

type Step = "instructions" | "consent" | "ready";

const TestInstructions = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("instructions");
  const [agreed, setAgreed] = useState(false);
  const [monitoringConsent, setMonitoringConsent] = useState(false);

  const handleStartTest = () => {
    if (!agreed || !monitoringConsent) {
      toast.error("Read the instructions and consent to webcam monitoring first.");
      return;
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
            <h1 className="text-3xl font-bold text-foreground">Test instructions</h1>
          </div>

          {step === "instructions" ? (
            <>
              <p className="text-lg text-muted-foreground mb-8">
                Read the following carefully before you begin your monitored learner theory test.
              </p>
              <div className="space-y-6 mb-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    General guidelines
                  </h2>
                  <ul className="space-y-3 ml-7">
                    <li>
                      The test consists of <strong>70 multiple choice questions</strong> drawn in random order from
                      the bank.
                    </li>
                    <li>
                      You must score at least <strong>80%</strong> to pass.
                    </li>
                    <li>
                      You have <strong>60 minutes</strong> to complete the test.
                    </li>
                    <li>
                      You may take the test only once every <strong>3 weeks</strong>.
                    </li>
                    <li>
                      If you fail, you must wait <strong>5 minutes</strong> before trying again (demo setting).
                    </li>
                    <li>
                      Your webcam stays active during the test. Verifiers can see live progress. Tab switches and
                      missing face events are flagged for review.
                    </li>
                  </ul>
                </div>
                <div className="bg-accent/30 border border-accent-foreground/20 rounded-lg p-4 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-sm">
                    <strong>Time management tip:</strong> You have roughly 51 seconds per question.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-6 p-4 bg-muted rounded-lg">
                <Checkbox id="agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                <label htmlFor="agree" className="text-sm font-medium cursor-pointer">
                  I have read and understood all the instructions
                </label>
              </div>
              <Button onClick={() => setStep("consent")} size="lg" className="w-full text-lg" disabled={!agreed}>
                Continue to webcam consent
              </Button>
            </>
          ) : null}

          {step === "consent" ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Webcam monitoring consent
              </h2>
              <p className="text-sm text-muted-foreground">
                The system shares periodic webcam snapshots with verifiers while you take the test, and monitors tab
                visibility. Suspicious activity is flagged for review instead of blocking your submission.
              </p>
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Checkbox
                  id="monitoring-consent"
                  checked={monitoringConsent}
                  onCheckedChange={(checked) => setMonitoringConsent(checked === true)}
                />
                <label htmlFor="monitoring-consent" className="text-sm font-medium cursor-pointer">
                  I consent to webcam monitoring for this test session
                </label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("instructions")}>
                  Back
                </Button>
                <Button onClick={() => setStep("ready")} disabled={!monitoringConsent}>
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === "ready" ? (
            <div className="space-y-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <p className="text-lg">You are cleared to start the monitored theory test.</p>
              <Button onClick={handleStartTest} size="lg" className="w-full text-lg">
                Start test
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default TestInstructions;
