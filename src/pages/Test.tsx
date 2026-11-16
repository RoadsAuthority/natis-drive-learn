import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { fetchQuestions, markAttempt, saveAttempt, postTestSessionHeartbeat, endTestSession } from "@/lib/natisApi";
import { useTestProctoring } from "@/hooks/useTestProctoring";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TestQuestion } from "@/types/question";

const Test = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const tRef = useRef(t);
  tRef.current = t;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [timerSynced, setTimerSynced] = useState(false);
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
      toast.error(tRef.current("test.needInstructions"));
      navigate("/instructions");
      return;
    }
    void proctoringRef.current.start();
  }, [consentGranted, navigate]);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const data = await fetchQuestions();
        if (data?.length) {
          setQuestions(data);
        } else {
          toast.error(t("test.noQuestions"));
          navigate("/portal");
        }
      } catch (e) {
        toast.error(t("test.loadFailed"), {
          description: (e as Error).message,
        });
        navigate("/portal");
      } finally {
        setLoadingQuestions(false);
      }
    };
    void loadQuestions();
  }, [navigate, t]);

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
        const session = await postTestSessionHeartbeat({
          currentQuestion: qIndex + 1,
          totalQuestions,
          answeredCount: Object.keys(currentAnswers).length,
          tabSwitches: p.tabSwitches,
          faceMissingEvents: p.faceMissingEvents,
          snapshot,
        });
        if (session.timeRemainingSeconds != null) {
          setTimeRemaining(session.timeRemainingSeconds);
          setTimerSynced(true);
        }
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
    if (!timerSynced) return;

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
  }, [handleSubmit, timerSynced]);

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
        <p className="text-muted-foreground">{t("test.loading")}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid items-start gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-24">
          <Card className="overflow-hidden border-0 bg-primary p-0 text-primary-foreground shadow-sm">
            <div className="border-b border-white/15 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">{t("portal.stepTestTitle")}</p>
              <p className="mt-1 text-sm font-semibold">
                {t("test.questionOf", { current: currentQuestion + 1, total: questions.length })}
              </p>
            </div>
            <div className="px-5 py-5">
              <div className="mb-2 flex items-center gap-2 text-white/80">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">{t("test.timeRemaining")}</span>
              </div>
              <p className="font-mono text-3xl font-semibold tabular-nums">{formatTime(timeRemaining)}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{t("test.navigator")}</h2>
              <span className="text-xs text-muted-foreground">{Object.keys(answers).length}/{questions.length}</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  aria-label={t("test.question", { number: idx + 1 })}
                  aria-current={currentQuestion === idx ? "step" : undefined}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`aspect-square rounded-md text-xs font-semibold transition-colors ${
                    currentQuestion === idx
                      ? "bg-primary text-primary-foreground"
                      : answers[q.id]
                        ? "bg-success/20 text-foreground hover:bg-success/30"
                        : "bg-muted text-muted-foreground hover:bg-secondary/15 hover:text-foreground"
                  } ${flagged.has(idx) ? "ring-2 ring-destructive ring-offset-1" : ""}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </Card>
        </aside>

        <section className="min-w-0 space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-3 p-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Camera className="h-4 w-4 text-primary" />
              <span>{t("test.monitoring")}</span>
              <span className="h-2 w-2 rounded-full bg-success" />
            </div>
            <div className="text-xs text-muted-foreground">
              {t("test.signals", { tabs: proctoring.tabSwitches, face: proctoring.faceMissingEvents })}
            </div>
            <video
              ref={proctoring.videoRef}
              className="h-12 w-[72px] rounded-md border border-border object-cover"
              autoPlay
              muted
              playsInline
            />
            {proctoring.error ? <p className="w-full text-xs text-destructive">{proctoring.error}</p> : null}
          </Card>

          <Card className="p-5 shadow-sm md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-sm font-medium text-secondary">{t("test.questionOf", { current: currentQuestion + 1, total: questions.length })}</p>
                <h2 className="mt-1 text-xl font-semibold md:text-2xl">{t("test.question", { number: currentQuestion + 1 })}</h2>
              </div>
              <Button
                variant="outline"
                size="icon"
                aria-label={t("test.flagQuestion")}
                onClick={toggleFlag}
                className={flagged.has(currentQuestion) ? "border-destructive text-destructive" : ""}
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>

            {language !== "en" ? <p className="mb-4 text-sm text-muted-foreground">{t("test.englishBank")}</p> : null}
            <p className="mb-6 text-base leading-relaxed md:text-lg">{question.question}</p>

            {question.imageUrl ? (
              <div className="mb-6 flex justify-center rounded-md border bg-muted/30 p-4">
                <img
                  src={question.imageUrl}
                  alt={t("test.diagramAlt")}
                  className="max-h-56 w-full max-w-lg object-contain"
                />
              </div>
            ) : null}

            <div className="space-y-2.5">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selectedAnswer === option.id}
                  onClick={() => handleAnswer(question.id, option.id)}
                  className={`flex w-full items-start gap-3 rounded-md border px-4 py-3.5 text-left transition-colors ${
                    selectedAnswer === option.id
                      ? "border-secondary bg-secondary/10"
                      : "border-border bg-card hover:border-secondary/50 hover:bg-secondary/5"
                  }`}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                    selectedAnswer === option.id
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : "border-muted-foreground/50 text-muted-foreground"
                  }`}>
                    {option.id}
                  </span>
                  <span className="pt-0.5 text-sm leading-5">{option.text}</span>
                </button>
              ))}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-5">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t("test.previous")}
              </Button>

              {currentQuestion === questions.length - 1 ? (
                <Button onClick={() => void handleSubmit()} disabled={submitting}>
                  {submitting ? t("test.submitting") : t("test.submit")}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  {t("test.next")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Test;
