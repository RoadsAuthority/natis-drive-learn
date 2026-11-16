import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  FileCheck2,
  Shield,
  User,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useEligibility } from "@/hooks/useEligibility";
import { formatDateShort } from "@/lib/formatDate";
import { useLanguage } from "@/i18n/LanguageProvider";

type StepStatus = "done" | "in_review" | "action_needed" | "locked";

type Step = {
  key: string;
  title: string;
  description: string;
  status: StepStatus;
  statusLabel: string;
  href?: string;
  actionLabel?: string;
};

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done") {
    return <CheckCircle2 className="h-6 w-6 text-success" />;
  }
  if (status === "in_review") {
    return <Clock className="h-6 w-6 text-amber-500" />;
  }
  return <Circle className="h-6 w-6 text-muted-foreground" />;
}

function statusBadgeVariant(status: StepStatus): "default" | "secondary" | "outline" {
  if (status === "done") return "default";
  if (status === "in_review") return "secondary";
  return "outline";
}

export default function Portal() {
  const navigate = useNavigate();
  const { profile, refresh } = useAuthContext();
  const { language, languages, locale, t, usingFallback } = useLanguage();
  const selectedLanguage = languages.find((item) => item.code === language);
  const {
    profileVerified,
    profileRejected,
    docsSubmitted,
    docsPendingReview,
    eyeTestComplete,
    paymentComplete,
    testPassed,
    testAttempted,
    journeyComplete,
    completedStepCount,
    totalSteps,
    canTakeTest,
    canAccessEyeTest,
    canBook,
    testSchedule,
  } = useEligibility();

  const verifyStatus: StepStatus = profileVerified
    ? "done"
    : docsPendingReview
      ? "in_review"
      : profileRejected
        ? "action_needed"
        : "action_needed";

  const eyeStatus: StepStatus = eyeTestComplete
    ? "done"
    : !canAccessEyeTest
      ? "locked"
      : "action_needed";

  const bookStatus: StepStatus = paymentComplete
    ? "done"
    : !canBook
      ? "locked"
      : "action_needed";

  const testStatus: StepStatus = testPassed
    ? "done"
    : testAttempted
      ? "action_needed"
      : !canTakeTest
        ? "locked"
        : "action_needed";

  const steps: Step[] = [
    {
      key: "verify",
      title: t("portal.stepVerifyTitle"),
      description: t("portal.stepVerifyBody"),
      status: verifyStatus,
      statusLabel: profileVerified
        ? t("portal.verified")
        : docsPendingReview
          ? t("portal.awaitingVerifier")
          : profileRejected
            ? t("portal.notApproved")
            : t("portal.notStarted"),
      href: "/profile-verification",
      actionLabel: docsSubmitted || profileVerified ? t("portal.viewUpdate") : t("portal.continue"),
    },
    {
      key: "eye",
      title: t("portal.stepEyeTitle"),
      description: t("portal.stepEyeBody"),
      status: eyeStatus,
      statusLabel: eyeTestComplete ? t("portal.complete") : canAccessEyeTest ? t("portal.required") : t("portal.locked"),
      href: "/eye-test",
      actionLabel: eyeTestComplete ? t("portal.view") : t("portal.open"),
    },
    {
      key: "book",
      title: t("portal.stepBookTitle"),
      description: t("portal.stepBookBody"),
      status: bookStatus,
      statusLabel: paymentComplete ? t("portal.bookedPaid") : canBook ? t("portal.required") : t("portal.locked"),
      href: "/booking",
      actionLabel: paymentComplete ? t("portal.viewBooking") : t("portal.book"),
    },
    {
      key: "test",
      title: t("portal.stepTestTitle"),
      description: t("portal.stepTestBody"),
      status: testStatus,
      statusLabel: testPassed
        ? t("portal.passed")
        : testAttempted
          ? t("portal.retake")
          : canTakeTest
            ? t("portal.ready")
            : t("portal.locked"),
      href: testPassed ? "/certificate" : "/instructions",
      actionLabel: testPassed ? t("portal.certificate") : testAttempted ? t("portal.viewInfo") : t("portal.start"),
    },
  ];

  const progressPercent = (completedStepCount / totalSteps) * 100;

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          {t("portal.refresh")}
        </Button>
      </div>

        {usingFallback && selectedLanguage ? (
          <p className="text-sm text-muted-foreground">
            {t("language.pending", { language: selectedLanguage.nativeName })}
          </p>
        ) : null}

        {profileRejected ? (
          <Card className="border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="font-semibold mb-1">{t("portal.rejectedTitle")}</p>
            <p>{profile?.rejection_reason ?? t("portal.rejectedFallback")}</p>
            <p className="mt-2">{t("portal.rejectedHelp")}</p>
          </Card>
        ) : null}

        {journeyComplete ? (
          <Card className="border-success/30 bg-success/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-success/10 p-2">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t("portal.completeTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("portal.completeBody")}</p>
              </div>
            </div>
            {testSchedule?.license_collection_from ? (
              <p className="text-sm rounded-md border border-success/20 bg-background/60 p-3">
                {t("portal.collectFrom", {
                  date: formatDateShort(testSchedule.license_collection_from, locale) ?? "—",
                })}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate("/my-profile")}>
                <User className="mr-2 h-4 w-4" />
                {t("portal.profile")}
              </Button>
              <Button variant="default" onClick={() => navigate("/certificate")}>
                <Award className="mr-2 h-4 w-4" />
                {t("portal.viewCertificate")}
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {!profileRejected ? (
              <Card className="border-0 bg-primary p-6 text-primary-foreground shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white/75">{t("portal.progress")}</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums">
                      {completedStepCount}<span className="mx-1 text-white/55">/</span>{totalSteps}
                    </p>
                  </div>
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white/35 text-sm font-semibold">
                    {Math.round(progressPercent)}%
                  </div>
                </div>
                <div
                  role="progressbar"
                  aria-label={t("portal.progress")}
                  aria-valuenow={Math.round(progressPercent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-5 h-2 overflow-hidden rounded-full bg-white/20"
                >
                  <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-white/75">
                  {t("portal.progressCount", { done: completedStepCount, total: totalSteps })}
                </p>
              </Card>
            ) : null}

            {docsPendingReview ? (
              <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <strong>{t("portal.awaiting")}</strong> {t("portal.awaitingBody")}
              </Card>
            ) : null}

            {profileVerified && !eyeTestComplete ? (
              <Card className="border-primary/30 bg-primary/5 p-4 text-sm">
                <p className="font-semibold mb-1">{t("portal.verifiedTitle")}</p>
                <p className="mb-3">{t("portal.verifiedNext")}</p>
                <Button size="sm" onClick={() => navigate("/eye-test")}>
                  {t("portal.verifiedAction")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            ) : null}

            {testSchedule && !testSchedule.can_take_test && testSchedule.test_block_reason ? (
              <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <p className="font-semibold mb-1">{t("portal.waitingTitle")}</p>
                <p>{testSchedule.test_block_reason}</p>
              </Card>
            ) : null}

            <Card className="p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                {t("portal.journey")}
              </h2>
              <ol className="grid gap-3 md:grid-cols-2">
                {steps.map((step) => {
                  const locked = step.status === "locked";

                  return (
                    <li
                      key={step.key}
                      className={`flex gap-3 rounded-lg border p-4 ${
                        step.status === "done"
                          ? "border-success/25 bg-success/5"
                          : step.status === "in_review"
                            ? "border-amber-500/30 bg-amber-500/5"
                            : locked
                              ? "border-border bg-muted/40 opacity-65"
                              : "border-primary/25 bg-accent/35"
                      }`}
                    >
                      <div className="pt-0.5">
                        <StepIcon status={step.status} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{step.title}</p>
                          <Badge variant={statusBadgeVariant(step.status)}>{step.statusLabel}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        {step.href && step.actionLabel ? (
                          <Button
                            size="sm"
                            className="mt-2"
                            disabled={locked}
                            variant={step.status === "done" ? "outline" : "default"}
                            onClick={() => {
                              if (!locked) navigate(step.href!);
                            }}
                          >
                            {step.key === "eye" ? <Eye className="mr-2 h-4 w-4" /> : null}
                            {step.key === "book" ? <Calendar className="mr-2 h-4 w-4" /> : null}
                            {step.actionLabel}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>
          </>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" className="justify-start h-auto py-4" onClick={() => navigate("/study")}>
            <BookOpen className="mr-3 h-5 w-5 shrink-0" />
            <span className="text-left text-sm">{t("portal.study")}</span>
          </Button>
          {profile?.role === "admin" ? (
            <Button variant="outline" className="justify-start h-auto py-4" onClick={() => navigate("/admin")}>
              <Shield className="mr-3 h-5 w-5 shrink-0" />
              <span className="text-left text-sm">{t("portal.admin")}</span>
            </Button>
          ) : null}
        </div>
      </div>
  );
}
