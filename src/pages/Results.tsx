import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Download, Home } from "lucide-react";
import { requestResultDocument } from "@/lib/natisApi";

type TestResults = {
  score: number;
  total: number;
  percentage: string;
  passed: boolean;
  reviewFlagged?: boolean;
  suspicionScore?: number;
  nextTestEligibleAt?: string | null;
  nextBookingEligibleAt?: string | null;
  licenseCollectionFrom?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString();
}

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResults | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("testResults");
    if (stored) {
      setResults(JSON.parse(stored));
    } else {
      navigate("/");
    }
  }, [navigate]);

  if (!results) return null;

  const downloadResult = async () => {
    await requestResultDocument(results);
    const documentText = [
      "Learner Theory Test Result",
      `Date: ${new Date().toLocaleDateString()}`,
      `Score: ${results.score}/${results.total}`,
      `Percentage: ${results.percentage}%`,
      `Status: ${results.passed ? "PASSED" : "FAILED"}`,
    ].join("\n");
    const blob = new Blob([documentText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "natis-result.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-8 shadow-lg text-center">
          <div className="mb-6">
            {results.passed ? (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-4">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
            )}
            <h1 className="text-4xl font-bold mb-2">
              {results.passed ? "Congratulations!" : "Test not passed"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {results.passed
                ? "You have successfully passed the learner theory test."
                : "You did not reach the 80% pass mark this time."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6 bg-muted">
              <p className="text-sm text-muted-foreground mb-1">Your score</p>
              <p className="text-3xl font-bold text-foreground">
                {results.score}/{results.total}
              </p>
            </Card>
            <Card className="p-6 bg-muted">
              <p className="text-sm text-muted-foreground mb-1">Percentage</p>
              <p className={`text-3xl font-bold ${results.passed ? "text-success" : "text-destructive"}`}>
                {results.percentage}%
              </p>
            </Card>
            <Card className="p-6 bg-muted">
              <p className="text-sm text-muted-foreground mb-1">Pass mark</p>
              <p className="text-3xl font-bold text-foreground">80%</p>
            </Card>
          </div>

          {results.passed ? (
            <div className="space-y-4">
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
                <p className="text-success font-medium">
                  Your result is available for download below.
                </p>
                {results.licenseCollectionFrom ? (
                  <p className="text-sm text-success mt-2">
                    You may collect your learner&apos;s licence from {formatDate(results.licenseCollectionFrom)}.
                  </p>
                ) : null}
              </div>
              {results.reviewFlagged ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                  This session was flagged for verifier review because of monitoring signals. Your result is still
                  recorded.
                </div>
              ) : null}
              <Button size="lg" className="w-full md:w-auto" onClick={() => void downloadResult()}>
                <Download className="mr-2 h-4 w-4" />
                Download certificate
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-destructive font-medium">
                  You may register for another test after the 13-week waiting period.
                </p>
                {results.nextBookingEligibleAt ? (
                  <p className="text-sm text-destructive mt-2">
                    Earliest re-registration date: {formatDate(results.nextBookingEligibleAt)}.
                  </p>
                ) : null}
              </div>
              {results.reviewFlagged ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                  Monitoring signals were recorded for verifier review.
                </div>
              ) : null}
            </div>
          )}

          <div className="flex gap-4 justify-center mt-8">
            <Button variant="outline" onClick={() => navigate("/portal")}>
              <Home className="mr-2 h-4 w-4" />
              Return to portal
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Test completed on {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default Results;
