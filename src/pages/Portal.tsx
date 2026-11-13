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
  LogOut,
  Shield,
  User,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useEligibility } from "@/hooks/useEligibility";
import { formatDateShort } from "@/lib/formatDate";
import { useLanguage } from "@/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
  const { user, profile, logout, refresh } = useAuthContext();
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const progressPercent = (completedStepCount / totalSteps) * 100;

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("portal.title")}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={() => navigate("/my-profile")}>
              <User className="mr-2 h-4 w-4" />
              {t("portal.profile")}
            </Button>
            {testPassed ? (
              <Button variant="outline" size="sm" onClick={() => navigate("/certificate")}>
                <Award className="mr-2 h-4 w-4" />
                {t("portal.certificate")}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              {t("portal.refresh")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("portal.signOut")}
            </Button>
          </div>
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
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{t("portal.progress")}</span>
                  <span className="text-muted-foreground">
                    {t("portal.progressCount", { done: completedStepCount, total: totalSteps })}
                  </span>
                </div>
                <Progress value={progressPercent} />
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
              <ol className="space-y-4">
                {steps.map((step) => {
                  const locked = step.status === "locked";

                  return (
                    <li
                      key={step.key}
                      className={`flex gap-3 rounded-lg border p-4 ${
                        step.status === "done"
                          ? "border-success/30 bg-success/5"
                          : step.status === "in_review"
                            ? "border-amber-500/30 bg-amber-500/5"
                            : locked
                              ? "opacity-60"
                              : ""
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
    </div>
  );
}
