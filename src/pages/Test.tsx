import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Camera, Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { mockQuestions } from "@/data/mockQuestions";
import { fetchQuestions, markAttempt, saveAttempt } from "@/lib/natisApi";
import { useTestProctoring } from "@/hooks/useTestProctoring";

const Test = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [questions, setQuestions] = useState(mockQuestions);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const consentGranted = sessionStorage.getItem("natis-proctoring-consent") === "true";
  const proctoring = useTestProctoring({ enabled: consentGranted, snapshotIntervalMs: 30000 });

  useEffect(() => {
    if (!consentGranted) {
      toast.error("Complete the monitored test instructions before starting.");
      navigate("/instructions");
      return;
    }
    void proctoring.start();
  }, [consentGranted, navigate]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await fetchQuestions();
        if (data?.length) setQuestions(data);
      } catch (e) {
        toast.error("Could not load question bank from API.", {
          description: (e as Error).message,
        });
      }
    };
    void loadQuestions();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current || !questions.length) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      let score = questions.reduce((acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0), 0);
      const marked = await markAttempt(answers, questions.length);
      if (marked?.score !== undefined) {
        score = Number(marked.score);
      }
      const percentage = (score / questions.length) * 100;
      const passed = percentage >= 80;
      const saved = await saveAttempt(score, questions.length, percentage, passed, proctoring.summary);
      localStorage.setItem(
        "testResults",
        JSON.stringify({
          score,
          total: questions.length,
          percentage: percentage.toFixed(1),
          passed,
          reviewFlagged: saved.reviewFlagged,
          suspicionScore: saved.suspicionScore,
          nextTestEligibleAt: saved.nextTestEligibleAt,
          nextBookingEligibleAt: saved.nextBookingEligibleAt,
          licenseCollectionFrom: saved.licenseCollectionFrom,
        })
      );
      sessionStorage.removeItem("natis-proctoring-consent");
      proctoring.stop();
      navigate("/results");
    } catch (error) {
      submittingRef.current = false;
      setSubmitting(false);
      toast.error((error as Error).message);
    }
  }, [answers, navigate, proctoring, questions]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          void handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion)) {
        next.delete(currentQuestion);
      } else {
        next.add(currentQuestion);
      }
      return next;
    });
  };

  const question = questions[currentQuestion];
  const progress = questions.length ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  if (!question) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">{formatTime(timeRemaining)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {questions.length}
              </div>
            </div>
            <div className="flex-1 min-w-[200px] max-w-xs">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </Card>

        <Card className="p-4 mb-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4 text-primary" />
              <span>Monitoring active</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Tab switches: {proctoring.tabSwitches} · Face missing events: {proctoring.faceMissingEvents}
            </div>
            <video
              ref={proctoring.videoRef}
              className="h-16 w-24 rounded-md border object-cover"
              autoPlay
              muted
              playsInline
            />
          </div>
          {proctoring.error ? <p className="mt-2 text-xs text-destructive">{proctoring.error}</p> : null}
        </Card>

        <Card className="p-8 mb-4 shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-semibold">Question {currentQuestion + 1}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFlag}
              className={flagged.has(currentQuestion) ? "text-destructive" : ""}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-lg mb-8 leading-relaxed">{question.question}</p>

          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  answers[currentQuestion] === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-card"
                }`}
              >
                <span className="font-semibold mr-3">{option.id}.</span>
                <span>{option.text}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentQuestion === questions.length - 1 ? (
            <Button onClick={() => void handleSubmit()} size="lg" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit test"}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <Card className="p-6 mt-6 shadow-lg">
          <h3 className="font-semibold mb-4">Question navigator</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`aspect-square rounded-md text-sm font-medium transition-colors ${
                  currentQuestion === idx
                    ? "bg-primary text-primary-foreground"
                    : answers[idx]
                      ? "bg-success/20 text-success-foreground hover:bg-success/30"
                      : "bg-muted hover:bg-muted/80"
                } ${flagged.has(idx) ? "ring-2 ring-destructive" : ""}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Test;
