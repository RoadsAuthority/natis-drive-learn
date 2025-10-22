import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";

const TestInstructions = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const handleStartTest = () => {
    if (!agreed) {
      toast.error("Please confirm that you have read the instructions");
      return;
    }
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
            <h1 className="text-3xl font-bold text-foreground">Test Instructions</h1>
          </div>

          <p className="text-lg text-muted-foreground mb-8">
            Please read the following carefully before you begin your test.
          </p>

          <div className="space-y-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                General Guidelines
              </h2>
              <ul className="space-y-3 ml-7">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>The test consists of <strong>70 multiple choice questions</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>You must score at least <strong>80%</strong> to pass.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>The test is timed. You will have <strong>60 minutes</strong> to complete it.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Each question has only one correct answer.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>No external help (books, phones, or talking) is allowed during the test.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>You may not restart the test once it begins.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>If your time runs out, the test will automatically end and be submitted.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>You will see your score immediately after submitting.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                How to Answer
              </h2>
              <ul className="space-y-3 ml-7">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Click on the answer option (A, B, C, or D) to select your choice.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Use the Next and Previous buttons to move between questions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>You can skip questions and return to them later.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Your answers are automatically saved as you go.</span>
                </li>
              </ul>
            </div>

            <div className="bg-accent/30 border border-accent-foreground/20 rounded-lg p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <p className="text-sm">
                <strong>Time Management Tip:</strong> You have approximately 51 seconds per question. 
                Don't spend too long on any single question.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-6 p-4 bg-muted rounded-lg">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <label
              htmlFor="agree"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have read and understood all the instructions
            </label>
          </div>

          <Button
            onClick={handleStartTest}
            size="lg"
            className="w-full text-lg"
            disabled={!agreed}
          >
            Start Test
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default TestInstructions;
