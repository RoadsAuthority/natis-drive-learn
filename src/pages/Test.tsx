import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Camera, Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { fetchQuestions, markAttempt, saveAttempt, postTestSessionHeartbeat, endTestSession } from "@/lib/natisApi";
import { useTestProctoring } from "@/hooks/useTestProctoring";
import type { TestQuestion } from "@/types/question";

const Test = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const consentGranted = sessionStorage.getItem("natis-proctoring-consent") === "true";
  const proctoring = useTestProctoring({ enabled: consentGranted, snapshotIntervalMs: 30000 });
  const proctoringRef = useRef(proctoring);
  proctoringRef.current = proctoring;
  const progressRef = useRef({ currentQuestion: 0, answers: {} as Record<string, string>, totalQuestions: 0 });
  progressRef.current = {
    currentQuestion,
    answers,
    totalQuestions: questions.length,
  };

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
      setLoadingQuestions(true);
      try {
        const data = await fetchQuestions();
        if (data?.length) {
          setQuestions(data);
        } else {
          toast.error("No questions available. Contact your administrator.");
          navigate("/portal");
        }
      } catch (e) {
        toast.error("Could not load question bank from API.", {
          description: (e as Error).message,
        });
        navigate("/portal");
      } finally {
        setLoadingQuestions(false);
      }
    };
    void loadQuestions();
  }, [navigate]);

  useEffect(() => {
    if (!questions.length || !consentGranted) return;

    let cancelled = false;

    const pulse = async () => {
      if (cancelled) return;
      const p = proctoringRef.current;
      const { currentQuestion: qIndex, answers: currentAnswers, totalQuestions } = progressRef.current;
      if (!totalQuestions) return;

      const snapshot =
        p.captureSnapshot() ?? p.snapshots[p.snapshots.length - 1] ?? undefined;

      try {
        await postTestSessionHeartbeat({
          currentQuestion: qIndex + 1,
          totalQuestions,
          answeredCount: Object.keys(currentAnswers).length,
          tabSwitches: p.tabSwitches,
          faceMissingEvents: p.faceMissingEvents,
          snapshot,
        });
      } catch {
        // Monitoring must not block the test.
      }
    };

    const startPulse = () => {
      void pulse();
      return window.setInterval(() => void pulse(), 15000);
    };

    let intervalId: number | undefined;
    const startWhenReady = window.setInterval(() => {
      if (proctoringRef.current.active) {
        window.clearInterval(startWhenReady);
        intervalId = startPulse();
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearInterval(startWhenReady);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      void endTestSession().catch(() => {});
    };
  }, [questions.length, consentGranted]);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current || !questions.length) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const marked = await markAttempt(answers);
      const score = Number(marked.score);
      const total = marked.total ?? questions.length;
      const percentage = Number(marked.percentage);
      const passed = Boolean(marked.passed);
      const saved = await saveAttempt(score, total, percentage, passed, proctoring.summary);
      localStorage.setItem(
        "testResults",
        JSON.stringify({
          score,
          total,
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
      await endTestSession().catch(() => {});
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

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
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
  const selectedAnswer = question ? answers[question.id] : undefined;

  if (loadingQuestions || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading your test questions…</p>
      </div>
    );
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

          <p className="text-lg mb-6 leading-relaxed">{question.question}</p>

          {question.imageUrl ? (
            <div className="mb-8 flex justify-center rounded-lg border bg-muted/30 p-4">
              <img
                src={question.imageUrl}
                alt="Diagram for this question"
                className="max-h-48 w-full max-w-md object-contain"
              />
            </div>
          ) : null}

          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(question.id, option.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedAnswer === option.id
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
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`aspect-square rounded-md text-sm font-medium transition-colors ${
                  currentQuestion === idx
                    ? "bg-primary text-primary-foreground"
                    : answers[q.id]
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
